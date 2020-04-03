import React from 'react';
import config from '.././shared/settings';
import util from '.././shared/utils';
import LoadingIndicatorComponent from '.././shared/LoadingIndicatorComponent';


// Declare this so our linter knows that tableau is a global object
/* global tableau */
/* global Treant */
/* global $ */

class Extension extends React.Component {

  /****************************/
  /*  Define initial state  */
  /****************************/
  constructor(props) {
    super(props);
    this.state = {
      'settings': config.defaults,
      'myChart': null,
      'isLoading': true
    }
    //  Bind event handlers to `this`
    this.resize = this.resize.bind(this);
    this.onComplete = this.onComplete.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  //  Run when the component is first added to the DOM
  componentDidMount(){

    //  Save a reference to `this`
    let thisComponent = this;

    /*******************************************************************************************/
    /*  Automatically size the div container, based on extension's available height/width      */
    /*******************************************************************************************/

    //  create event handler for when the frame resizes
    window.addEventListener("resize", thisComponent.resize);

    //  Run once at the start, to make sure the visual fits within the container
    thisComponent.resize();

    /**************************************/
    /*  Initialize the Tableau extension  */
    /**************************************/

    /*  Functinon to drill into the hierarchy, based on level   */
    function drill(children, currentLevel, maxLevel){

      //  Do we keep drilling?
      if (currentLevel<maxLevel){
        //  Loop through all children
        children.forEach( (child) => {
          //  Mark the child as not-collapsed
          child.collapsed = false;
          //  If the child has more children, keep drilling
          if (child.children) {
            drill(child.children, currentLevel+1, maxLevel);
          }
        })
      }
    }

    /*  Function to render the treant visualization   */
    async function renderTreant(settings) {

      //  Load data
      let rawData = await getDataFromTableau(settings.data.worksheet);

      //  Structure data for TreantJS
      let data = createHierarchy(rawData, settings)

      //  Make sure the first node is expanded (2 levels)
      data.collapsed = false;  
      
      //  Handle level drilldown
      if (settings.formatting.levelsToShow>2) {
        //  Make sure the first x levels past the root is expanded
        drill(data.children, 2, settings.formatting.levelsToShow);
      }
      
      //  Setup config object
      let treantConfig = {
        'nodeStructure': data,
        'chart': {
          'container': util.getSelectorById(config.ids.treeContainer),
          'rootOrientation': settings.formatting.rootNodeOrientation,   //  NORTH, EAST, WEST, SOUTH
          'nodeAlign': settings.formatting.verticalAlignment,       //  CENTER, TOP, BOTTOM
          'levelSeparation': 30,      //  PX
          'siblingSeparation': 30,    //  px
          'subTreeSeparation': 30,    //  px
          'hideRootNode':false,
          'animateOnInit': false,
          'animateOnInitDelay': 500,    //  milliseconds
          'scrollbar': 'native',      //  native, fancy, None
          'padding': 15,          //  px
          'connectors': {
            'type': 'step',     //  curve, bCurve, step, straight
            'stackIndent': 15     //  px
          },
          'node': {
            'collapsable': true,
            'HTMLclass': 'nodeExample1',//  From example.css
            'target': '_self'     //  _self or _blank
          },
          // 'animation': {
          //  'nodeSpeed' : 450,      //  ms
          //  'nodeAnimation': 'linear',
          //  'connectorsSpeed': 450,   //  ms
          //  'connectorsAnimation': 'linear'
          // },
          'callback': {
            'onAfterClickCollapseSwitch': thisComponent.onClick,
            'onTreeLoaded': thisComponent.onComplete
          }
        }
      }
      
      //  Clear container just in case
      clearTreant();

      //  Render into div container
      let chart = new Treant(treantConfig);

      //  Save back to the state
      thisComponent.setState({
        'myChart': chart,
        'settings': settings,
        'isLoading': false
      })
    }

    /*  Function to get data from the tableau worksheet   */
    function getDataFromTableau(selectedWorksheet) {
        
      //  Get the current dashboard
      let dashboard = tableau.extensions.dashboardContent.dashboard;

      //  Get the worksheet with our data
      let matches = dashboard.worksheets.filter( function(ws){
        return ws.name === selectedWorksheet;
      })

      //  Get the summary data from the selected worksheet
      if (matches.length === 1) {
        //  Worksheet found!
        const worksheet = matches[0];
        //  Return the data in that worksheet
        return worksheet.getSummaryDataAsync().then(function(response){
          return response
        })
      } else {
        //  No worksheet found, return an empty data set
        return null
      }
    }

    /*  Process the data, and create a structure TreantJS can read  */
    function createHierarchy(dataset, settings){

      //  Sample data structure, for when no data was added
      const sampleData = {
          text: { name: "Please configure the extension, in order to view your hierarchy tree" },
          children: [
              {
                  text: { name: "sample data 1" }
              },
              {
                  text: { name: "sample data 2" }
              }
          ]
      }

      //  Was there any data provided?
      if (!dataset) {

        //  No, so return the sample structure to provide instructions
        return sampleData;

      } else {

        //  Yes, so parse the data table and convert to a tree structure

        //  Define constant for NULL values
        let n = 'NULL';

        //  Create a flat array of nodes in the format required for treantjs
        let flat = [];
        dataset.data.forEach( function(row){

          //  Init placeholder for these 
          let id,
            parentId,
            text = {
              'name': ''
            };

          //  Use the settings, to determine the column #s for id, parent, and label
          for (let x=0; x<row.length; x++){
            
            //  Get the column name
            let column = dataset.columns[x].fieldName;

            //  Flag to check if the data point is generic text for the box, or used somewhere specific
            let isGeneric = true;

            //  Figure out where to put this data point
            if (column === settings.data.nodeId){
              //  It's the id of the node
              id = row[x].formattedValue;
              isGeneric = false;
            } 
            if (column === settings.data.nodeLabel){
              //  Its the node's text label
              text.name = row[x].formattedValue;
              isGeneric = false;
            }
            if (column === settings.data.parentId){
              //  Its the node's parent id
              parentId = row[x].formattedValue;
              isGeneric = false;
            }
            if (column === settings.action.field){
              //  Its the node's parent id
              text['data-parameter'] = row[x].formattedValue;
              isGeneric = false;
            }
            if (column === settings.data.color){
              //  Its the node's background color
              let colors = util.colorToHex(row[x].formattedValue);
              text['data-bg-color'] = colors.background;
              text['data-font-color'] = colors.font;
              isGeneric = false;
            }
            if (isGeneric) {
              //  everything else is supplimental info, and should be displayed as text
              text[column] = row[x].formattedValue;
            }
          }

          //  is there a parent id?
          let parent = (parentId.toUpperCase() === n) ? null : parentId;

          //  Define a node
          let node = {
            'HTMLid': 'tree-node-' + id, 
            'HTMLclass': 'card',
            'parentId': parent,       //  Needed only for the hierarchy creation
            'id': id,           //  Needed only for the hierarchy creation
            'collapsed': true,        //  Make the whole tree collapsed by default
            'text': text
          }

          //  Add the node to our dictionary
          flat.push(node)
        })

        /* stolen from: https://hackernoon.com/you-might-not-need-that-recursive-function-in-javascript-275651522185  */

        // Create root for top-level node(s)
        const root = [];
        // Cache found parent index
        const map = {};

        flat.forEach(node => {
          // No parentId means top level
          if (!node.parentId) return root.push(node);
          
          // Insert node as child of parent in flat array
          let parentIndex = map[node.parentId];
          if (typeof parentIndex !== "number") {
            parentIndex = flat.findIndex(el => el.id === node.parentId);
            map[node.parentId] = parentIndex;
          }
          
          if (parentIndex<0){
            util.log('Node ' + node.id + ' specified a parent of id ' + node.parentId + ', but that parent does not exist.  skipping this one.')
          } else {
            if (!flat[parentIndex].children) {
              return flat[parentIndex].children = [node];
            }
            flat[parentIndex].children.push(node);
          }
        });

        //  The above code creates an array (in case of multiple roots), but we can assume a single root node
        return root[0];
      }
    }

    /*  Function to clear any existing treant visualizations  */
    function clearTreant() {

      //  Has the myChart object been initialized w/ the treant model?
      if (thisComponent.state.myChart){
        //  Yes, call the destroy function
        thisComponent.state.myChart.destroy()
      } 
    }

    /**************************************/
    /*  Initialize the Tableau extension  */
    /**************************************/

    //  Function that runs when the user clicks the configure button in Tableau
    function configure () {

      //  Determine the config popup's url
      const url = window.location.href + '#config';
    
      //  Initialize the extension's config popup     
      tableau.extensions.ui.displayDialogAsync(url, '', config.configPopup.size).then((closePayload) => {
        loadSettings()
      }).catch((error) => {
        // One expected error condition is when the popup is closed by the user (meaning the user
        // clicks the 'X' in the top right of the dialog).  This can be checked for like so:
        switch (error.errorCode) {
          case tableau.ErrorCodes.DialogClosedByUser:
            util.log('Config popup was closed by user');
            break;
          default:
            util.log(error.message);
        }
      });
    }

    //  Function to get the tableau settings and update state
    function loadSettings(){
      //  Fetch the new settings from tableau api
      const settingsString = tableau.extensions.settings.get(config.settingsKey)
      //  Save to this component
      const settings = settingsString ? JSON.parse(settingsString) : config.defaults;
      //  Re-render the tree
      renderTreant(settings);
    }

    //  Initialize the extension
    tableau.extensions.initializeAsync({'configure': configure}).then(function () {

      //  Mark the tableau api as loaded
      loadSettings()

      //  Watch for updates to settings
      tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
        loadSettings()
      });
    });
  }

  /**************************************/
  /*  Event Handlers                    */
  /**************************************/

  /*  Function to run, after the object is resized  */
  resize(){

    //  Resize the html element's height/width
    let t = $(util.getSelectorById(config.ids.treeContainer));
    $(t).css('height', window.innerHeight);
    $(t).css('width', window.innerWidth);
    
    //  redraw the tree
    if (this.state.myChart) {
      this.state.myChart.tree.redraw()
    }
    util.log("Resizing the tree")
  }

  /*  Event handler for when the tree is completed  */
  onComplete(target){

    //  Set background color for each node
    $("div.node").each(function(){
      $(this).css('background-color', $(this).attr('data-bg-color'))
      $(this).css('color', $(this).attr('data-font-color'))
    })

    //  Remove the loading dialog
    

    util.log("Treant visual complete");
  }

  /*  Event handler for when a node is clicked  */
  onClick(target){

    //  Is the setting enabled, to set parameter values on click?
    if (this.state.settings.action.enabled) {

      //  Get the new parameter selection
      const selection = $(target.parentElement).attr('data-parameter');

      //  Make sure a parameter & field are specified, and there was a value
      let hasParameterId = this.state.settings.action.parameter.length>0,
          hasParameterField = this.state.settings.action.field.length>0;
      if (hasParameterField && hasParameterId && selection){

        //  Find a reference to the tableau parameter
        tableau.extensions.dashboardContent.dashboard.findParameterAsync(this.state.settings.action.parameter).then( (parameter) => {
          //  Make sure a valid parameter was returned  
          if (parameter) {
            //  Update it's value
            parameter.changeValueAsync(selection)
          }
        })
      }
    }   
  }

  /**************************************/
  /*  HTML Output to render             */
  /**************************************/
  render() {
    const showLoading = () => {
      if (this.state.isLoading){
        return <LoadingIndicatorComponent msg=""></LoadingIndicatorComponent>
      }
    }
    return (
      <div>
        { showLoading() }
        <div id={config.ids.treeContainer}>
        </div>
      </div>
    );
  }
}

export default Extension;
