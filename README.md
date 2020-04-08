# IOT environment station

This project has been made for the "Internet of Things" course at "La Sapienza University of Rome". The goal is to build a cloud-based IoT system that collects information from a set of environmental sensors using the MQTT protocol, which is controlled by a Google cloud IoT platform backend, implementing the Core-IoT and Pub/Sub API.
To visualize the results, I have also implemented a dashboard, showing the current values, the last hour values and finally all the values collected by the application.

To understand how does it work, I suggest you to take a look at the hands-on tutorials and the Youtube demonstrations.
These are divided in 2 parts, where in the first one I explain how to work with virtual sensors implemented by very simple Node.js programs, in the second part I extend the project implementing also RIOT-OS sensors, which can work also on real hardware devices.

## Part 1
Introduction to the project, Node.js virtual sensors and dashboard

### links
- [Youtube demonstration](https://youtu.be/MFi_sELNDRY)
- [Hands-on tutorial](https://www.hackster.io/ivagnesmanuel/iot-2020-assignment1-13aa68)



## Part 2
Build on-top of the cloud-based components developed in the first part, here there is the extension including the RIOT-OS devices, the MQTT-SN protocol and the transparent gateway.

### links
- [Youtube demonstration](https://youtu.be/zVOfD81fPKc)
- [Hands-on tutorial](https://www.hackster.io/ivagnesmanuel/iot-2020-assignment2-5069b8)



**Note**: All the code is made to work with my credentials on my personal google account.
I did not upload the keys, If u want to run it, you need to make your own setup.
