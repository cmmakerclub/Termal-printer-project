### Termal printer
This project is use pi to print image using termal printer (or any use setup printer)

----
### printer_worker.js
Run this app on any pi that connect to internet and set already setup printer.

Pi will get data from rabbitMQ and print.

You can set up pi to n device because they get data by queue.

After install to config, copy file in **Config/default.json** to **Config/local.json** and edit to your config.

----
### input_server.js
Run this app on your cloud or local server. 

Install rabbitMQ on your os.

input_server.js have main 3 path.

	get /
	get /comment
	post /print_image_64

**/** will render html with input this input send data to **/comment**. This will generate image with user input text and save to **images** folder.

**/print_image_64** will get image by sending image with base64 string name **image_64** and save to **images** folder.

After install to config, copy file in **Config/default.json** to **Config/local.json** and edit to your config.

----
### line_service.js
Current host on heroku, you can put on your server.

**line\_service.js** will read image from your line messaging and send to your api server (**input_server.js**) with base64 string.

If you use heroku, please config this variable.

	heroku config:set channelAccessToken=[token]
	heroku config:set channelSecret=[token]
	heroku config:set apiImageUrl=[full url]
		
Those token your can find from your line develop console.