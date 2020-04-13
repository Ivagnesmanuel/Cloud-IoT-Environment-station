/*
 * All the code is based on the emcute example, modified sections between **
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>

#include "thread.h"
#include "msg.h"
#include "xtimer.h"
#include "random.h"

#include "shell.h"
#include "semtech_loramac.h"

extern semtech_loramac_t loramac;

#ifdef MODULE_SEMTECH_LORAMAC_RX
#define LORAMAC_RECV_MSG_QUEUE                   (4U)
static msg_t _loramac_recv_queue[LORAMAC_RECV_MSG_QUEUE];
static char _recv_stack[THREAD_STACKSIZE_DEFAULT];

static void *_wait_recv(void *arg)
{
    msg_init_queue(_loramac_recv_queue, LORAMAC_RECV_MSG_QUEUE);

    (void)arg;
    while (1) {
        /* blocks until something is received */
        switch (semtech_loramac_recv(&loramac)) {
            case SEMTECH_LORAMAC_RX_DATA:
                loramac.rx_data.payload[loramac.rx_data.payload_len] = 0;
                printf("Data received: %s, port: %d\n",
                (char *)loramac.rx_data.payload, loramac.rx_data.port);
                break;

            case SEMTECH_LORAMAC_RX_LINK_CHECK:
                printf("Link check information:\n"
                   "  - Demodulation margin: %d\n"
                   "  - Number of gateways: %d\n",
                   loramac.link_chk.demod_margin,
                   loramac.link_chk.nb_gateways);
                break;

            case SEMTECH_LORAMAC_RX_CONFIRMED:
                puts("Received ACK from network");
                break;

            default:
                break;
        }
    }
    return NULL;
}
#endif

//function to add parameters to the payload
static int add_payload(char* payload, char* telemetry, int min, int max)
{
    char value[10];
    sprintf(value, "%hd", (short) (min + random_uint32() % (max+1 - min)));

    strcat(payload, telemetry);
    strcat(payload, " ");
    strcat(payload, value);

	  return 0;
}


// function to send message (inherited by by the tx command)
static int loramac_send(char* payload){
    uint8_t cnf = LORAMAC_DEFAULT_TX_MODE;  /* Default: confirmable */
    uint8_t port = LORAMAC_DEFAULT_TX_PORT; /* Default: 2 */

    semtech_loramac_set_tx_mode(&loramac, cnf);
    semtech_loramac_set_tx_port(&loramac, port);

    switch (semtech_loramac_send(&loramac,
                                 (uint8_t *)payload, strlen(payload))) {
        case SEMTECH_LORAMAC_NOT_JOINED:
            puts("Cannot send: not joined");
            return 1;

        case SEMTECH_LORAMAC_DUTYCYCLE_RESTRICTED:
            puts("Cannot send: dutycycle restriction");
            return 1;

        case SEMTECH_LORAMAC_BUSY:
            puts("Cannot send: MAC is busy");
            return 1;

        case SEMTECH_LORAMAC_TX_ERROR:
            puts("Cannot send: error");
            return 1;

        case SEMTECH_LORAMAC_TX_CNF_FAILED:
            puts("Fail to send: no ACK received");
            return 1;
    }

    return 0;
}


// function added to implement the autonomus perdiodic value sending
static int cmd_infinite(int argc, char **argv)
{

    // check that connection with TTN is enstablished
    if (semtech_loramac_join(&loramac, LORAMAC_JOIN_OTAA)!=SEMTECH_LORAMAC_ALREADY_JOINED){
      puts("You need to join TTN first, read the tutorial!\n");
      return 1;
    }

    if (argc < 4) {
        puts("Missing values, correct usage: start [deviceID] [interval] [telemetries to send separated by space]\n\n");
        puts("The possible values for telemetries are:\n	temperature\n	humidity\n	wind_direction\n	wind_intensity\n	rain_height\n\n");
        return 1;
    }


    char* deviceid = argv[1];
    short interval = atoi(argv[2]);

    while(1){

        // initialize the payload with the deviceid
        // the size of the buffer does not really influence the performance
        // the send primitive will remove the excess
        char payload[120];
        strcpy(payload, deviceid);
        strcat(payload, ": ");


        // add selected components to the payload
        short i;
        for (i=3; i<argc; i++){
          if (strcmp(argv[i],"temperature") == 0)
            add_payload(payload, "temperature", -50, 50);

          else if (strcmp(argv[i],"humidity") == 0)
            add_payload(payload, "humidity", 0, 100);

          else if (strcmp(argv[i],"wind_direction") == 0)
            add_payload(payload, "direction", 0, 360);

          else if (strcmp(argv[i],"wind_intensity") == 0)
            add_payload(payload, "intensity", 0, 100);

          else if (strcmp(argv[i],"rain_height") == 0)
            add_payload(payload, "height", 0, 50);

          if (i != argc-1){
            strcat(payload, "; ");
          } else {
            strcat(payload, ": ");
          }
        }

        // try to send the payload 5 times
        short attempt = 0;
        while (attempt < 5){
          if (loramac_send(payload)) {
              printf("Error occurred while transmitting... attempt number %d of 5\n", attempt);
	            attempt++;
	            xtimer_sleep(10);
          }   else {
              printf("Sent: [ %s ]\n", (char*) payload);
	            attempt=5;
          }
        }

    	xtimer_sleep(interval);

    }

  return 0;
}


static const shell_command_t shell_commands[] = {
        {"start", "Start the station", cmd_infinite},
        { NULL, NULL, NULL }
};

int main(void)
{
    #ifdef MODULE_SEMTECH_LORAMAC_RX
      thread_create(_recv_stack, sizeof(_recv_stack),
                    THREAD_PRIORITY_MAIN - 1, 0, _wait_recv, NULL, "recv thread");
    #endif

    puts("****************** The device started the execution ******************\n");

    /* start shell */
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    /* should be never reached */
    return 0;
}
