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

#include "shell.h"
#include "semtech_loramac.h"

extern semtech_loramac_t loramac;

// function to generate the payload to send
static char* gen_payload(char* device, int min, int max)
{
    char value[10];
    sprintf(value, "%d", min + rand() % (max+1 - min));
    char date[20];
    sprintf(date, "%lu", ((unsigned long)time(NULL)));

    char* payload = malloc(sizeof(char)*60);
    strcpy(payload, device);
    strcat(payload, " ");
    strcat(payload, value);
    strcat(payload, " ");
    strcat(payload, date);
    strcat(payload, "000");

	return payload;
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

    printf("Message sent: %s ", payload);
    return 0;
}


// function added to implement the autonomus perdiodic value sending
static int cmd_infinite(int argc, char **argv)
{

    if (semtech_loramac_join(&loramac, LORAMAC_JOIN_OTAA)!=SEMTECH_LORAMAC_ALREADY_JOINED){
      puts("You need to join TTN first, read the tutorial!\n");
      return 1;
    }

    char* payload = "";
    short interval = atoi(argv[1]);

    if (argc < 3) {
        puts("Missing values, correct usage: start [interval] [telemetries to send separated by space]\n\n");
        puts("The possible values for telemetries are:\n	temperature\n	humidity\n	wind_direction\n	wind_intensity\n	rain_height\n\n");
        return 1;
    }

    while(1){
  		//send temperature value

	    short i;
   		for (i=2; i<argc; i++){
   			if (strcmp(argv[i],"temperature") == 0)
   				payload = gen_payload("temperature", -50, 50);

   			else if (strcmp(argv[i],"humidity") == 0)
   				payload = gen_payload("humidity", 0, 100);

   			else if (strcmp(argv[i],"wind_direction") == 0)
   				payload = gen_payload("direction", 0, 360);

   			else if (strcmp(argv[i],"wind_intensity") == 0)
   				payload = gen_payload("intensity", 0, 100);

   			else if (strcmp(argv[i],"rain_height") == 0)
   				payload = gen_payload("height", 0, 50);


        short attempt = 0;
        while (attempt < 3){
          if (loramac_send(payload)) {
              printf("Error occurred while transmitting... attempt number %d of 3\n", attempt);
	            attempt++;
          }   else {
            printf("Sent: [ %s ]\n", (char*) payload);
          }
          xtimer_sleep(10);
        }

    		xtimer_sleep(10);
   		}

      free(payload);
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
    puts("****************** Device1 started the execution ******************\n");

    /* start shell */
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);

    /* should be never reached */
    return 0;
}
