# IOT environment station

This project has been made, through different assignments, for the "Internet of Things" course at "La Sapienza University of Rome". The final goal was to build a cloud-based IoT system that collects information from a set of environmental sensors using the MQTT protocol, which is controlled by a Google cloud IoT platform backend, implementing the Core-IoT and Pub/Sub API.
To visualize the results, I have also implemented a dashboard, showing the current values, the last hour values, and finally all the values collected by the application.

To understand how does it work, I suggest you take a look at the hands-on tutorials and the Youtube demonstrations.
These are divided into different parts, one for each assignment, each of them containing a different typology of device and networking technology.

!! When you clone the repository, use the **--recursive** flag, to download also the RIOT submodule !!


## Section 1
This section contains the introduction to the project, the Node.js virtual sensors, and the first version of the dashboard.

### links
- [Youtube demonstration](https://youtu.be/MFi_sELNDRY)
- [Hands-on tutorial](https://www.hackster.io/ivagnesmanuel/iot-2020-assignment1-13aa68)


## Section 2
Build on-top of the cloud-based components developed in the first section, here there is the first extension, including the RIOT-OS devices, the MQTT-SN protocol, and the MQTT-SN/MQTT transparent gateway.

### links
- [Youtube demonstration](https://youtu.be/zVOfD81fPKc)
- [Hands-on tutorial](https://www.hackster.io/ivagnesmanuel/iot-2020-assignment2-5069b8)



## Section 3
The goal of this section is to add to the collection new RIOT-OS devices, which this time use the LoRa low-power wide-area network technology and are connected to the Cloud backend through TheThingsNetwork.
Moreover, this time, I have also uploaded the code on real hardware, on the B-L072Z-LRWAN1 LoRa kit, using the IoT-LAB testbed.

### links
- [Youtube demonstration](https://www.youtube.com/watch?v=g2B8veH1yhc)
- [Hands-on tutorial](https://www.hackster.io/ivagnesmanuel/testing-riot-os-devices-on-iot-lab-using-lorawan-and-ttn-fb8115)


**Note**: All the code is made to work with my credentials on my personal google account.
I did not upload the keys, If u want to run it, you need to make your own setup.
