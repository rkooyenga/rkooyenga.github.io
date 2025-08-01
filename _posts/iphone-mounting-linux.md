This answer worked for me [https://askubuntu.com/a/928751/684030](https://askubuntu.com/a/928751/684030)


`sudo apt install ifuse`

`sudo apt install libimobiledevice-utils`

`idevicepair pair`

`idevicepair validate`

`ideviceinfo` for info

When I got the success after validate I still had to create a directory in my home directory called pics (as shown in answer linked above) then

`ifuse pics`

You can now navigate to the pics directory to find your pictures

you have to unmount the folder after so you can use `fusermount -u ~/pics && rmdir ~/pics`

in case one get No device found, is it plugged in? run
 `systemctl restart usbmuxd.service`
