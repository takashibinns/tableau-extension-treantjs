# TreantJS Extension

This project shows allows you to visualize hierarchical data, that is stored in a self-referencing data structure.  This is a common way to store hierarchies of unknown depth, such as employee org charts or BOM for a product.  This extension leverages the open-source TreantJS library, in order to produce the visualization.
![Extension Screenshot](/screenshots/extension-1.png)


## Usage in Tableau Desktop

### Create the dataset
Before we can use the extension, you need some data to use for the tree.  This extension assumes each row of your dataset has a column with a unique identifier (id) as well as a column with the parent's unique identifier.  Create a new sheet that has at least these two columns, as well as any labels, measures, or anything else you want to display within each block.  The most efficient way to build a sheet for this, is to just put all these dimensions/measures under details and have nothing under rows/columns.
![Data Sheet Screenshot](/screenshots/extension-2.png)

Once you've got all your data points in the sheet, drag that sheet onto your dashboard.  You can [hide this sheet](https://help.tableau.com/current/pro/desktop/en-us/dashboards_organize_floatingandtiled.htm#show-and-hide-floating-containers-by-clicking-a-button) from the end users if desired, but it just has to live on the dashboard in order for a Tableau Extension to use it's data.

Optionally, you can also create a parameter so that when a user clicks on a block it sets a value.

Now that we've got our data ready, download the [Extension Manifest file](/TreantExtension-public.trex).  Within Tableau Desktop, drag an *Extension* object onto your dashboard and select the **.trex** file you've downloaded.  This should give you a default visual suggesting you configure the extension.  This will open up a popup, with 3 tabs.
![Configure Button](/screenshots/extension-3.png)

### Configure the data tab
![Config Data Screenshot](/screenshots/config-1.png)

Select the worksheet that contains your data, and you should see the other dropdowns update to show the fields within that sheet.  Select the fields for NodeId, NodeLabel, ParentId, and color (otherwise each block will default to a white background).  Any leftover fields in your sheet will automatically populate into the block.

### Configure the action tab
![Config Action Screenshot](/screenshots/config-2.png)

This extension gives you the option of adding a user-action trigger.  If enabled, you can specify a *field* to pull a value from and a *parameter* to update every time a user clicks on a node.  Keep in mind that if you pick a field for parameters, it will be hidden by default from each block.

### Configure the formatting tab
![Config Formatting Screenshot](/screenshots/config-3.png)

Lastly, you can configure some formatting options of the visual.  

Option | Values | Description
--- | --- | --- |
Root Orientation | NORTH,SOUTH,EAST,WEST | This determines where the root node should start from (top,left,right,bottom)
Node Alignment | CENTER,TOP,BOTTOM | This determines how the nodes will align at each level, from the top/bottom/center of each node at that level
Visible Levels | 2+ | How many levels of the hierarchy to show by default (defaults to top 2 levels)


## Self-Hosting
If you would like to build this extension from source to host on your own web server, follow the instructions below.  
- Navigate to this folder in a command prompt.
- Run `yarn install`.
- Run `yarn build`.

Once the build command completes, you can copy the files in the build directory to your web server.  This extension is a stand-alone webpage with no backend services (static webpage).  

## Development
If you would like to run this extension locally and/or make modifications, follow the instructions below to get started.

- Navigate to this folder in a command prompt.
- Run `yarn install`.
- Run `yarn start` to start the web server and compile the code (automatic updates are enabled).
- Open Tableau, add a new extension object, and locate the `TreantExtension-local.trex` file in this folder to use the extension.
