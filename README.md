# JMAP
## Setting index.html as new Login Page 
## Recommended: Should be added last after finalizing the Map Application (If application is still using webappbuilder to configure, refer to "Path Fix Step")


#### Replace index.html file of application
1. Create new file named "home.html" in same directory as index.html
2. Copy paste everything in index.html into home.html

#### Initialize index.html as new Login Page
1. Copy paste everything from index.html of this repository into the index.html you replaced in the step above
2. Copy paste all corresponding folders e.g. js, css, scss, images into the same directory as index.html

#### Path Fix
If application is still using webappbuilder to configure widgets, themes and so on, but you wish to add the replace the login page in, you will need to fix the redirect path on web app builder. (You may have to beautify code for easier search)

1. Open to WebAppBuilderForArcGIS\client\builder\main.js
2. Ctrl/Cmd F "_updateAppId:"
3. Within the function under "b = window.appInfo.appPath + "index.html";", change index to home and save

## Using JSON file to loop through categories in Identify Widget

#### Replace List.js file
1. Replace the List.js file with the List.js file in this repo under widgets/Identify
2. Copy paste category.json from the repo into the same directory as List.js

