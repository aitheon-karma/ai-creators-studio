import { Component, OnInit, Input } from '@angular/core';
// import { Workflow } from '../../shared/workflow';
import { Workspace, Project } from '@aitheon/creators-studio';
import { Validators, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import * as _ from 'lodash';

@Component({
  selector: 'ai-project-form-settings',
  templateUrl: './project-form-settings.component.html',
  styleUrls: ['./project-form-settings.component.scss']
})
export class ProjectFormSettingsComponent implements OnInit {

  @Input() workspaces: any[];
  @Input() project: Project;
  @Input() Workspace: Workspace;
  // @Input() Workflow: Workflow;

  get formAiData() {
    return <FormArray>this.projectSettingsForm.get('aiInterfaces');
  }
  get formExData() {
    return <FormArray>this.projectSettingsForm.get('exInterfaces');
  }

  // workflow: Workflow;
  projectSettingsForm: FormGroup;
  currentLanguage: any;
  currentEditor: any;
  currentSimulator: any;
  currentCompiler: string;
  currentType: any;
  submitted = false;
  currentLanguages: any[];
  currentEditors: any[] = [];
  currentSimulators: any[] = [];
  currentCompilers: string[] = [];
  selectedNewAiInterface: any;
  selectedNewExInterface: any;
  isSelectAiOpened = false;
  isSelectExOpened = false;

  // aiInterfaces = [
  //   // { id: 1, name: 'RTPS', value: AiInterfaces.RTPS },
  //   // { id: 2, name: 'Management Interface', value: AiInterfaces.MANAGEMENT_INTERFACE }
  // ];

  // availableAiInterfaces = [];
  // exInterfaces = [
  //   // { id: 1, name: 'Web Socket', value: ExInterfaces.WEB_SOCKET },
  //   // { id: 2, name: 'HTTP', value: ExInterfaces.HTTP }
  // ];

  // availableExInterfaces = [];

  // allExInterfaces = [
  //   { id: 1, name: 'Web Socket', value: ExInterfaces.WEB_SOCKET },
  //   { id: 2, name: 'HTTP', value: ExInterfaces.HTTP },
  //   { id: 3, name: 'USB', value: ExInterfaces.USB },
  //   { id: 4, name: 'Ethernet', value: ExInterfaces.ETHERNET },
  //   { id: 5, name: 'Serial', value: ExInterfaces.SERIAL }
  // ];

  // allAiInterfaces = [
  //   { id: 1, name: 'RTPS', value: AiInterfaces.RTPS },
  //   { id: 2, name: 'Management Interface', value: AiInterfaces.MANAGEMENT_INTERFACE },
  //   { id: 3, name: 'Web Socket', value: AiInterfaces.WEB_SOCKET },
  //   { id: 4, name: 'REST API', value: AiInterfaces.REST_API }
  // ];

  get formSimData() {
    return <FormArray>this.projectSettingsForm.get('simulatorsArray');
  }


  constructor(
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
    this.currentType = this.project.projectType;
    // this.workflow = new Workflow();
    // if (this.project.externalInterfaces) {
    //   this.exInterfaces = this.project.externalInterfaces;
    // }
    // if (this.project.aitheonInterfaces) {
    //   this.aiInterfaces = this.project.aitheonInterfaces;
    // }
    // this.availableAiInterfaces = _.differenceBy(this.allAiInterfaces, this.aiInterfaces, 'id');
    // this.availableExInterfaces = _.differenceBy(this.allExInterfaces, this.exInterfaces, 'id');
    this.getProjectSettingsForm();
  }

  getProjectSettingsForm() {
    this.projectSettingsForm = this.fb.group({
      summary: [this.project.summary],
      aiInterfaces: this.addCheckboxes(),
      exInterfaces: this.addExCheckboxes()
    });
  }


  addCheckboxes() {
    // const arr = this.aiInterfaces.map((o, i) => {
    //   return this.fb.control({ value: true, disabled: false });
    // });
    // return this.fb.array(arr);
  }

  addExCheckboxes() {
    // const arr = this.exInterfaces.map((o, i) => {
    //   return this.fb.control({ value: true, disabled: false });
    // });
    // return this.fb.array(arr);
  }


  onCheckNext() {
    this.submitted = true;
    const array = this.projectSettingsForm.controls['aiInterfaces'] as FormArray;
    const aiInterfacesArray = [];
    // for (let i = 0; i < this.aiInterfaces.length; i++) {
    //   const item = array.at(i);
    //   if (item.value) {
    //     aiInterfacesArray.push(this.aiInterfaces[i]);
    //   }
    // }
    // this.project.aitheonInterfaces = aiInterfacesArray;

    const arrayEx = this.projectSettingsForm.controls['exInterfaces'] as FormArray;
    const exInterfacesArray = [];
    // for (let i = 0; i < this.exInterfaces.length; i++) {
    //   const item = arrayEx.at(i);
    //   if (item.value) {
    //     exInterfacesArray.push(this.exInterfaces[i]);
    //   }
    // }
    // this.project.externalInterfaces = exInterfacesArray;
    if (this.projectSettingsForm.valid) {
      return true;
    }
    return false;
  }

  addNewAiControls(selectControl: any) {
    // this.aiInterfaces.push(selectControl);
    // this.availableAiInterfaces = this.availableAiInterfaces.filter(av => {
    //   return av !== selectControl;
    // });
    const control = new FormControl();
    (this.projectSettingsForm.controls.aiInterfaces as FormArray).push(control);
    this.isSelectAiOpened = false;
  }

  openNewAiControl() {
    this.isSelectAiOpened = !this.isSelectAiOpened;
    this.isSelectExOpened = false;
  }

  openNewExControl() {
    this.isSelectExOpened = !this.isSelectExOpened;
    this.isSelectAiOpened = false;
  }

  addNewExControls(selectControl: any) {
    // this.exInterfaces.push(selectControl);
    // this.availableExInterfaces = this.availableExInterfaces.filter(av => {
    //   return av !== selectControl;
    // });
    const control = new FormControl();
    (this.projectSettingsForm.controls.exInterfaces as FormArray).push(control);
    this.isSelectExOpened = false;
  }

  showConfirm(event) {
    this.selectedNewAiInterface = event;
  }

  showExConfirm(event) {
    this.selectedNewExInterface = event;
  }


  changeValue(ai) {
    ai.setValue(!ai.value);
  }

  changeExValue(ex) {
    ex.setValue(!ex.value);
  }

  back() {
    // this.Workflow.finished = false;
    // this.Workflow.state--;
  }

}
