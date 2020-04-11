import uuid, jwt, ssl, random, os, logging, datetime, argparse, time, sys, json
import paho.mqtt.client as mqtt

global minimum_backoff_time
global MAXIMUM_BACKOFF_TIME


# SETUP GOOGLE
project_id = 'iot-assign1'
registry_id = 'my-registry'
cloud_region = 'europe-west1'
device_id = 'LoRa_gateway'
sub_topic = 'events'
ca_cert_path = 'roots.pem'
log_path = 'config_log.csv'
algorithm = 'RS256'
rsa_cert_path = 'rsa_cert.pem'
rsa_private_path = 'rsa_private.pem'
mqtt_bridge_hostname = 'mqtt.googleapis.com'
mqtt_bridge_port = 443

#SETUP TheThingsNetwork
f = open("ttn_password.txt", "r")
ttn_app_id = "enviroment_station"
ttn_access_key = f.readline()                         #from ttn_password.txt
ttn_host = 'eu.thethings.network'
ttn_port = 1883


print('****************** Gateway actived ******************');

###################################### TTN code ########################################################################################

def on_connect_ttn(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("+/devices/+/up")

# The callback for when a PUBLISH message is received from the server.
def on_message_ttn(client, userdata, msg):
    print("Received message from TTN: "+msg.topic+" "+str(msg.payload))
    formatted_payload = json.loads(msg.payload)
    #to_send = formatted_payload['dev_id'] + " " + formatted_payload['payload_raw'].decode('base64')
    to_send = formatted_payload['payload_raw'].decode('base64')
    google_client.publish(mqtt_topic, to_send, qos=0)

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
    client.connect(mqtt_bridge_hostname, mqtt_bridge_port, keepalive=60)

    # This is the topic that the device will receive configuration updates on.
    mqtt_config_topic = '/devices/{}/config'.format(device_id)

    # Subscribe to the config topic.
    client.subscribe(mqtt_config_topic, qos=0)

    # The topic that the device will receive commands on.
    mqtt_command_topic = '/devices/{}/commands/#'.format(device_id)

    # Subscribe to the commands topic, QoS 1 enables message acknowledgement.
    print('Subscribing to {}'.format(mqtt_command_topic))
    client.subscribe(mqtt_command_topic, qos=0)

    return client



if __name__ == "__main__":

	#client connetted to TTN
	gate = mqtt.Client()
	gate.on_connect = on_connect_ttn
	gate.on_message = on_message_ttn
	gate.username_pw_set(ttn_app_id, ttn_access_key)
	gate.connect("eu.thethings.network", 1883, 60)


	#client to connect to google cloud
	jwt_iat = datetime.datetime.utcnow()
	jwt_exp_mins = 20
	google_client = get_client( project_id, cloud_region, registry_id,
						device_id, rsa_private_path, algorithm,
						ca_cert_path, mqtt_bridge_hostname, mqtt_bridge_port)

	mqtt_topic = '/devices/{}/{}'.format(device_id, sub_topic)

	gate.loop_start()
	google_client.loop_start()

	try:
		while True:
			time.sleep(1)

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
