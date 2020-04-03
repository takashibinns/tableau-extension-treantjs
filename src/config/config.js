import React from 'react';
import { Button, Tabs, DropdownSelect, Checkbox, Stepper } from '@tableau/tableau-ui';
import config from '.././shared/settings';
import './config.css';

// Declare this so our linter knows that tableau is a global object
/* global tableau */

class Config extends React.Component{

  /****************************/
  /*  Define initial state  */
  /****************************/
  constructor(props) {
    super(props);
    this.state = {
      'settings': config.defaults,
      'dashboard': {},
      'parameters': [],
      'worksheets': [],
      'fields': {},
      'selectedTabIndex': 0,
      'selectedSheet': null
    }
    //  Bind event handlers to `this`
    this.saveThenCloseDialog = this.saveThenCloseDialog.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
  }

  /**********************************************/
  /*  Run when component is 1st written to DOM  */
  /**********************************************/
  componentDidMount(){

    //  Function to asynchronously fetch all the column headers on a worksheet
    function getFieldsFromWorksheet(worksheet){
      //  Return the promise for getSummaryDataAsync()
      return worksheet.getSummaryDataAsync().then(function(response) {
        //  Return the columns array
        return response.columns;
      })
    }

    //  Function to asynchronously fetch all parameters from a dashboard
    function getParametersFromDashboard(dashboard){
      //  Return the promise for getParametersAsync()
      return dashboard.getParametersAsync().then(function(response){
        //  Return the parameters array
        return response;
      })
    }

    // Function to asynchronously get all data needed for the config popup
    async function initConfig(){

      //  Look for any saved settings
      const settingsString = tableau.extensions.settings.get(config.settingsKey);
      const settings = settingsString ? JSON.parse(settingsString) : config.defaults;

      //  Update the reference to the dashbaord
      let dashboard = tableau.extensions.dashboardContent.dashboard;

      //  Initialize some placeholders
      let worksheets = [];
      let fieldsDict = {};

      //  Get a list of parameters for this dashboard
      let parameters = await getParametersFromDashboard(dashboard);

      //  Create promise array to make the call for each worksheet on the dashboard
      let dataset = await Promise.all(dashboard.worksheets.map(async (worksheet) => {
        //  Define the promise for this worksheet
        let fields = await getFieldsFromWorksheet(worksheet);
        //  Return the worksheet, along w/ the fields
        return {
          'worksheet': worksheet,
          'fields': fields
        }        
      }));

      //  Organize the data returned
      dataset.forEach(function(data,index){
        //  Is this the current selected worksheet?
        let isSelected = thisComponent.isItemSelected(data.worksheet.name, settings.data.worksheet, index);
        //  Save a reference to this worksheet
        worksheets.push({'value': data.worksheet.name, 'label': data.worksheet.name, 'isSelected': isSelected})
        //  Mark the selected worksheet
        if (isSelected){
          settings.data.worksheet = data.worksheet.name;
        }
        //  Save the fields for this worksheet
        fieldsDict[data.worksheet.name] = data.fields

      })

      //  Update the state
      thisComponent.setState({
        'settings': settings,
        'dashboard': dashboard,
        'parameters': parameters,
        'worksheets': worksheets,
        'selectedSheet': settings.data.worksheet,
        'fields': fieldsDict
      })
    }

    //  Save a reference to this component
    let thisComponent = this;

    //  Initialize the popup using tableau extension api
    tableau.extensions.initializeDialogAsync().then(initConfig)
  }

  // Background helper that checks to see if the current item should be marked as selected
  isItemSelected(item, setting, index) {
    //  Make sure something is selected as a setting
    if (setting) {
      //  Return true, if the item matches the setting
      return (item === setting);
    } else {
      //  Return true, if there is no setting but this is the first item in the list
      return (index === 0);
    }
  }

  //  Function to save and then close the popup dialog
  saveThenCloseDialog () {

    //  Save a reference to this component
    let thisComponent = this;

    //  Persist the changes made to settings
    tableau.extensions.settings.set(config.settingsKey, JSON.stringify(thisComponent.state.settings));
    tableau.extensions.settings.saveAsync().then((newSavedSettings) => {
      thisComponent.closeDialog()
    });
  }

  //  Function to close the popup without saving
  closeDialog() {
    //  Trigger the popup to close
    tableau.extensions.ui.closeDialog();
  }

  /*  HTML Output   */
  render() {

    //  Create a title bar
    const title = <div className="tableau-titlebar">
                    <span className="tableau-titlebar-label">Configure Extension</span>
                    <span className="tableau-titlebar-close-button" onClick={this.closeDialog}>x</span>
                  </div>

    //  Define what tabs to display in the config popup
    const tabs = [ 
      { 
        content: 'Data', 
      }, { 
        content: 'Actions' 
      }, { 
        content: 'Formatting' 
      } 
    ];

    //  Function to produce a set of dropdown menu items for each field
    const getFields = (key) => {
      //  Check to see if there's a user selection already saved
      const savedSelection = this.state.settings.data[key];
      const isSelection = (savedSelection.length>0);
      //  Safely get a list of all fields for the given worksheet
      let fieldsList = this.state.fields.hasOwnProperty(this.state.selectedSheet) ? this.state.fields[this.state.selectedSheet] : [];
      let fields = []
      //  Loop through the fields
      fieldsList.forEach( (field,index) => {
        //  Is this field the selected field?
        let isSelected = (isSelection) ? (field.fieldName===savedSelection) : (index===0);
        //  Create the HTML element
        fields.push(<option key={index} value={field.fieldName} selected={isSelected}>{field.fieldName}</option>)
        //  If there is no saved user selection, mark the first item in the list as the selection by default
        if (isSelected && !isSelection) {
          setSelection(field.fieldName,'data',key,this);
        }
      })
      return fields;
    }

    //  Function to produce a set of dropdown menu items for parameters
    const getParameters = () => {
      //  Check to see if there's a user selection already saved
      const savedSelection = this.state.settings.action.parameter;
      const isSelection = (savedSelection.length>0);
      //  Loop through each parameter
      let params = []
      this.state.parameters.forEach( (parameter,index) => {
        //  Is this field the selected field?
        let isSelected = (isSelection) ? (parameter.name===savedSelection) : (index===0);
        //  Create the HTML element
        params.push(<option key={index} value={parameter.name} selected={isSelected}>{parameter.name}</option>)
        //  If there is no saved user selection, mark the first item in the list as the selection by default
        if (isSelected && !isSelection) {
          setSelection(parameter.name,'action','parameter',this);
        }
      })
      return params
    }

    //  Function to produce a set of dropdown menu items for fields valid for the selected parameter
    const getParamFields = () => {

      //  Check to see if there's a user selection already saved
      const savedSelection = this.state.settings.action.field;
      const isSelection = (savedSelection.length>0);
      //  Safely get a list of all fields for the given worksheet
      let fieldsList = this.state.fields.hasOwnProperty(this.state.selectedSheet) ? this.state.fields[this.state.selectedSheet] : [];
      let fields = []
      //  Loop through the fields
      fieldsList.forEach( (field,index) => {
        //  Is this field the selected field?
        let isSelected = (isSelection) ? (field.fieldName===savedSelection) : (index===0);
        //  Create the HTML element
        fields.push(<option key={index} value={field.fieldName} selected={isSelected}>{field.fieldName}</option>)
        //  If there is no saved user selection, mark the first item in the list as the selection by default
        if (isSelected && !isSelection) {
          setSelection(field.fieldName,'action','field',this);
        }
      })
      return fields;
    }

    //  Function to create dropdown menu options, based on objects with the following format:
    //  obj = { value: 'selection value', isSelected: true/false, label: 'text to display'}
    const makeOption = (item, index) => <option key={index} value={item.value} selected={item.isSelected}>{item.label}</option>;
    

    //  Event handler, for when a dropdown menu selection is changed
    const setSelection = (value,section,key,thisComponent) => {
      var newSettings = {...thisComponent.state.settings}
      newSettings[section][key] = value;
      thisComponent.setState({'settings': newSettings})
    }
    //  Define the data selection page
    const tab1 =  <div>
                    <div className="tableau-section-title">Where do we get the data?</div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Worksheet:</span>
                      <DropdownSelect  kind='line'
                        onChange={ e => { this.setState({'selectedSheet': e.target.value}) }} >
                        { this.state.worksheets.map(makeOption) }
                      </DropdownSelect>
                    </div>
                    <div className="tableau-section-title">What fields do we use?</div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Node ID:</span>
                      <DropdownSelect  kind='line'
                        onChange={ e => { setSelection(e.target.value,'data','nodeId',this) }} >
                        { getFields("nodeId") }
                      </DropdownSelect>
                    </div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Node Labels:</span>
                      <DropdownSelect  kind='line'
                        onChange={ e => { setSelection(e.target.value,'data','nodeLabel',this) }} >
                        { getFields("nodeLabel") }
                      </DropdownSelect>
                    </div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Parent IDs:</span>
                      <DropdownSelect  kind='line'
                        onChange={ e => { setSelection(e.target.value,'data','parentId',this) }} >
                        { getFields("parentId") }
                      </DropdownSelect>
                    </div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Color (optional):</span>
                      <DropdownSelect  kind='line'
                        onChange={ e => { setSelection(e.target.value,'data','color',this) }} >
                        <option key={-1} value={config.none}>None</option>
                        { getFields("color") }
                      </DropdownSelect>
                    </div>
                  </div>;

    //  Define the parameter selection page
    const tab2 = <div>
                  <div className="tableau-section-title">Set a parameter value, on selection</div>
                    <div className="tableau-section-group">
                      <Checkbox checked={this.state.settings.action.enabled} 
                      onChange={ e => { setSelection(e.target.checked,'action','enabled',this) }}/>
                      <span className="tableau-section-label">Enabled</span>
                    </div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Parameter:</span>
                      <DropdownSelect  kind='line'
                        onChange={ e => { setSelection(e.target.value,'action','parameter',this) }} >
                        { getParameters() }
                      </DropdownSelect>
                    </div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Field Value:</span>
                      <DropdownSelect  kind='line'
                        onChange={ e => { setSelection(e.target.value,'action','field',this) }} >
                        { getParamFields() }
                      </DropdownSelect>
                    </div>
                 </div>;

    //  Formatting option lists
    let orientationOptions = ['NORTH','WEST','SOUTH','EAST'];
    let alignmentOptions = ['CENTER','TOP','BOTTOM'];

    //  Define the formatting page
    const tab3 =  <div>
                    <div className="tableau-section-title">Formatting Settings</div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Root Orientation:</span>
                      <DropdownSelect  kind='line'
                        onChange={ e => { setSelection(e.target.value,'formatting','rootNodeOrientation',this) }} >
                        {
                          orientationOptions.map(option => <option key={option} value={option} selected={this.state.settings.formatting.rootNodeOrientation===option}>{option}</option>)
                        }
                      </DropdownSelect>
                    </div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Node Alignment:</span>
                      <DropdownSelect  kind='line'
                        onChange={ e => { setSelection(e.target.value,'formatting','verticalAlignment',this) }} >
                        {
                          alignmentOptions.map(option => <option key={option} value={option} selected={this.state.settings.formatting.rootNodeOrientation===option}>{option}</option>)
                        }
                      </DropdownSelect>
                    </div>
                    <div className="tableau-section-group">
                      <span className="tableau-section-label">Visible Levels:</span>
                      <Stepper min={2} max={10} step={1} pageSteps={1} value={this.state.settings.formatting.levelsToShow} 
                        onValueChange={value => setSelection(value, 'formatting', 'levelsToShow',this) } />
                    </div>
                  </div>;
    
    //  Pick which HTML to render, based on the selected tab
    const content = {
      0: tab1,
      1: tab2,
      2: tab3
    }

    //  Create a footer with the save button
    const footer = <div className="tableau-footer">
                    <Button kind="outline" key="cancelButton" onClick={this.closeDialog}>Cancel</Button>
                    <Button kind="primary" key="saveButton" onClick={this.saveThenCloseDialog}>Save</Button>
                  </div>

    //  Return the HTML to render
    return (
      <div className="container">
        { title }
        <Tabs tabs={tabs} selectedTabIndex={this.state.selectedTabIndex}
              onTabChange={(index) => { this.setState({'selectedTabIndex': index});}}>
          { content[this.state.selectedTabIndex] }
        </Tabs>
        { footer }
      </div>
    );
  }
}

export default Config;
