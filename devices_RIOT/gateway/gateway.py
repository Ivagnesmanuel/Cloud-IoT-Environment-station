import uuid, jwt, ssl, random, os, logging, datetime, argparse
import paho.mqtt.client as mqtt
import MQTTSN, socket, time, MQTTSNinternal, thread, types, sys, struct

global minimum_backoff_time
global MAXIMUM_BACKOFF_TIME

# SETUP
project_id = 'iot-assign1'
registry_id = 'my-registry'
cloud_region = 'europe-west1'
device_id = 'gateway'
sub_topic = 'events'
ca_cert_path = 'roots.pem'
log_path = 'config_log.csv'
algorithm = 'RS256'
rsa_cert_path = 'rsa_cert.pem'
rsa_private_path = 'rsa_private.pem'
mqtt_bridge_hostname = 'mqtt.googleapis.com'
mqtt_bridge_port = 443

print('****************** Gateway actived ******************');

################################################# Devices code ########################################################################
class Callback:

  def __init__(self):
    self.events = []
    self.registered = {}

  def connectionLost(self, cause):
    print "default connectionLost", cause 
    self.events.append("disconnected")

#function modified to directly forward messages from devices to google
  def messageArrived(self, topicName, payload, qos, retained, msgid):
    print "Recived data from device:", payload				
    google_client.publish(mqtt_topic, payload, qos=0)
    return True

  def deliveryComplete(self, msgid):
    print "default deliveryComplete" 

  def advertise(self, address, gwid, duration):
    print "advertise", address, gwid, duration 

  def register(self, topicid, topicName):
    self.registered[topicId] = topicName


class Client:

  def __init__(self, clientid, host="localhost", port=1883):
    self.clientid = clientid
    self.host = host
    self.port = port
    self.msgid = 1
    self.callback = None
    self.__receiver = None

  def start(self):
    self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    self.sock.bind((self.host, self.port))
    mreq = struct.pack("4sl", socket.inet_aton(self.host), socket.INADDR_ANY)

    self.sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)

    self.startReceiver()

  def stop(self):
    self.stopReceiver()

  def __nextMsgid(self):
    def getWrappedMsgid():
      id = self.msgid + 1
      if id == 65535:
        id = 1
      return id

    if len(self.__receiver.outMsgs) >= 65535:
      raise "No slots left!!"
    else:
      self.msgid = getWrappedMsgid()
      while self.__receiver.outMsgs.has_key(self.msgid):
        self.msgid = getWrappedMsgid()
    return self.msgid


  def registerCallback(self, callback):
    self.callback = callback


  def connect(self, cleansession=True):
    self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    #self.sock.settimeout(5.0)

    self.sock.connect((self.host, self.port))

    connect = MQTTSN.Connects()
    connect.ClientId = self.clientid
    connect.CleanSession = cleansession
    connect.KeepAliveTimer = 0
    self.sock.send(connect.pack())

    response, address = MQTTSN.unpackPacket(MQTTSN.getPacket(self.sock))
    assert response.mh.MsgType == MQTTSN.CONNACK

    self.startReceiver()


  def startReceiver(self):
    self.__receiver = MQTTSNinternal.Receivers(self.sock)
    if self.callback:
      id = thread.start_new_thread(self.__receiver, (self.callback,))


  def waitfor(self, msgType, msgId=None):
    if self.__receiver:
      msg = self.__receiver.waitfor(msgType, msgId)
    else:
      msg = self.__receiver.receive()
      while msg.mh.MsgType != msgType and (msgId == None or msgId == msg.MsgId):
        msg = self.__receiver.receive()
    return msg


  def subscribe(self, topic, qos=2):
    subscribe = MQTTSN.Subscribes()
    subscribe.MsgId = self.__nextMsgid()
    if type(topic) == types.StringType:
      subscribe.TopicName = topic
      if len(topic) > 2:
        subscribe.Flags.TopicIdType = MQTTSN.TOPIC_NORMAL
      else:
        subscribe.Flags.TopicIdType = MQTTSN.TOPIC_SHORTNAME
    else:
      subscribe.TopicId = topic # should be int
      subscribe.Flags.TopicIdType = MQTTSN.TOPIC_PREDEFINED
    subscribe.Flags.QoS = qos
    if self.__receiver:
      self.__receiver.lookfor(MQTTSN.SUBACK)
    self.sock.send(subscribe.pack())
    msg = self.waitfor(MQTTSN.SUBACK, subscribe.MsgId)
    return msg.ReturnCode, msg.TopicId


  def unsubscribe(self, topics):
    unsubscribe = MQTTSN.Unsubscribes()
    unsubscribe.MsgId = self.__nextMsgid()
    unsubscribe.data = topics
    if self.__receiver:
      self.__receiver.lookfor(MQTTSN.UNSUBACK)
    self.sock.send(unsubscribe.pack())
    msg = self.waitfor(MQTTSN.UNSUBACK, unsubscribe.MsgId)


  def register(self, topicName):
    register = MQTTSN.Registers()
    register.TopicName = topicName
    if self.__receiver:
      self.__receiver.lookfor(MQTTSN.REGACK)
    self.sock.send(register.pack())
    msg = self.waitfor(MQTTSN.REGACK, register.MsgId)
    return msg.TopicId


  def publish(self, topic, payload, qos=0, retained=False):
    publish = MQTTSN.Publishes()
    publish.Flags.QoS = qos
    publish.Flags.Retain = retained
    if type(topic) == types.StringType:
      publish.Flags.TopicIdType = MQTTSN.TOPIC_SHORTNAME
      publish.TopicName = topic
    else:
      publish.Flags.TopicIdType = MQTTSN.TOPIC_NORMAL
      publish.TopicId = topic
    if qos in [-1, 0]:
      publish.MsgId = 0
    else:
      publish.MsgId = self.__nextMsgid()
      print("MsgId", publish.MsgId)
      self.__receiver.outMsgs[publish.MsgId] = publish
    publish.Data = payload
    self.sock.send(publish.pack())
    return publish.MsgId


  def disconnect(self):
    disconnect = MQTTSN.Disconnects()
    if self.__receiver:
      self.__receiver.lookfor(MQTTSN.DISCONNECT)
    self.sock.send(disconnect.pack())
    msg = self.waitfor(MQTTSN.DISCONNECT)


  def stopReceiver(self):
    self.sock.close() # this will stop the receiver too
    assert self.__receiver.inMsgs == {}
    assert self.__receiver.outMsgs == {}
    self.__receiver = None

  def receive(self):
    return self.__receiver.receive()

#######################################################################################################################################

###################################### Google code ####################################################################################
def create_jwt(project_id, private_key_file, algorithm):
    """Creates a JWT (https://jwt.io) to establish an MQTT connection.
        Args:
         project_id: The cloud project ID this device belongs to
         private_key_file: A path to a file containing either an RSA256 or
                 ES256 private key.
         algorithm: The encryption algorithm to use. Either 'RS256' or 'ES256'
        Returns:
            A JWT generated from the given project_id and private key, which
            expires in 20 minutes. After 20 minutes, your client will be
            disconnected, and a new JWT will have to be generated.
        Raises:
            ValueError: If the private_key_file does not contain a known key.
        """

    token = {
            # The time that the token was issued at
            'iat': datetime.datetime.utcnow(),
            # The time the token expires.
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
            # The audience field should always be set to the GCP project id.
            'aud': project_id
    }

    # Read the private key file.
    with open(private_key_file, 'r') as f:
        private_key = f.read()

    print('Creating JWT using {} from private key file {}'.format(
            algorithm, private_key_file))

    return jwt.encode(token, private_key, algorithm=algorithm)



def error_str(rc):
    """Convert a Paho error to a human readable string."""
    return '{}: {}'.format(rc, mqtt.error_string(rc))


def on_connect(unused_client, unused_userdata, unused_flags, rc):
    """Callback for when a device connects."""
    print'on_connect', mqtt.connack_string(rc)

    # After a successful connect, reset backoff time and stop backing off.
    global should_backoff
    global minimum_backoff_time
    should_backoff = False
    minimum_backoff_time = 1


def on_disconnect(unused_client, unused_userdata, rc):
    """Paho callback for when a device disconnects."""
    print'on_disconnect', error_str(rc)

    # Since a disconnect occurred, the next loop iteration will wait with
    # exponential backoff.
    global should_backoff
    should_backoff = True


def on_publish(unused_client, unused_userdata, unused_mid):
    """Paho callback when a message is sent to the broker."""
    print'publishing data to google'


def on_message(unused_client, unused_userdata, message):
    """Callback when the device receives a message on a subscription."""
    payload = str(message.payload.decode('utf-8'))
    print('Received message \'{}\' on topic \'{}\' with Qos {}'.format(
            payload, message.topic, str(message.qos)))

def get_client(
        project_id, cloud_region, registry_id, device_id, private_key_file,
        algorithm, ca_certs, mqtt_bridge_hostname, mqtt_bridge_port):
    """Create our MQTT client. The client_id is a unique string that identifies
    this device. For Google Cloud IoT Core, it must be in the format below."""
    client_id = 'projects/{}/locations/{}/registries/{}/devices/{}'.format(
            project_id, cloud_region, registry_id, device_id)
    print('Device client_id is \'{}\''.format(client_id))

    client = mqtt.Client(client_id=client_id)

    # With Google Cloud IoT Core, the username field is ignored, and the
    # password field is used to transmit a JWT to authorize the device.
    client.username_pw_set(
            username='unused',
            password=create_jwt(
                    project_id, private_key_file, algorithm))

    # Enable SSL/TLS support.
    client.tls_set(ca_certs=ca_certs, tls_version=ssl.PROTOCOL_TLSv1_2)

    # Register message callbacks. https://eclipse.org/paho/clients/python/docs/
    # describes additional callbacks that Paho supports. In this example, the
    # callbacks just print to standard out.
    client.on_connect = on_connect
    client.on_publish = on_publish
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    # Connect to the Google MQTT bridge.
    client.connect(mqtt_bridge_hostname, mqtt_bridge_port)

    # This is the topic that the device will receive configuration updates on.
    mqtt_config_topic = '/devices/{}/config'.format(device_id)

    # Subscribe to the config topic.
    client.subscribe(mqtt_config_topic, qos=1)

    # The topic that the device will receive commands on.
    mqtt_command_topic = '/devices/{}/commands/#'.format(device_id)

    # Subscribe to the commands topic, QoS 1 enables message acknowledgement.
    print('Subscribing to {}'.format(mqtt_command_topic))
    client.subscribe(mqtt_command_topic, qos=0)

    return client



if __name__ == "__main__":


 
	#client connetted to devices
	gate = Client("linh", port=1885)
	gate.registerCallback(Callback())
	gate.connect()
	
	rc, topic1 = gate.subscribe("telemetry")
	
	
	#client to connect to google cloud
	jwt_iat = datetime.datetime.utcnow()
	jwt_exp_mins = 20
	google_client = get_client( project_id, cloud_region, registry_id,
						device_id, rsa_private_path, algorithm,
						ca_cert_path, mqtt_bridge_hostname, mqtt_bridge_port)
	
	mqtt_topic = '/devices/{}/{}'.format(device_id, sub_topic)
	
	
	try:
		while True:
			time.sleep(1)
			google_client.loop()
			
			if should_backoff:
				# If backoff time is too large, give up.
				if minimum_backoff_time > MAXIMUM_BACKOFF_TIME:
					print('Exceeded maximum backoff time. Giving up.')
            				break

        			# Otherwise, wait and connect again.
        			delay = minimum_backoff_time + random.randint(0, 1000) / 1000.0
        			print('Waiting for {} before reconnecting.'.format(delay))
        			time.sleep(delay)
        			minimum_backoff_time *= 2
        			google_client.connect(mqtt_bridge_hostname, mqtt_bridge_port)
        		
        		seconds_since_issue = (datetime.datetime.utcnow() - jwt_iat).seconds
    			if seconds_since_issue > 60 * jwt_exp_mins:
				print('Refreshing token after {}s'.format(seconds_since_issue))
        			jwt_iat = datetime.datetime.utcnow()
        			google_client.loop()
        			google_client.disconnect()
        			google_client = get_client(project_id, cloud_region, registry_id,
						device_id, rsa_private_path, algorithm,
						ca_cert_path, mqtt_bridge_hostname, mqtt_bridge_port)


	
	except KeyboardInterrupt:
		gate.unsubscribe("telemetry")
		gate.disconnect()
		google_client.disconnect()
	


