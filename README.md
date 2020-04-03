# TreantJS Extension

This project shows allows you to visualize hierarchical data, that is stored in a self-referencing data structure.  This is a common way to store hierarchies of unknown depth, such as employee org charts or BOM for a product.  This extension leverages the open-source TreantJS library, in order to produce the visualization.

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