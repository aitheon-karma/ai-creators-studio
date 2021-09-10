import { debounceTime, switchMap } from 'rxjs/operators';
import { Component, OnInit, Input, ViewChild, OnChanges, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Project, Workspace, ProjectsRestService } from '@aitheon/creators-studio';
@Component({
  selector: 'ai-project-form-start',
  templateUrl: './project-form-start.component.html',
  styleUrls: ['./project-form-start.component.scss']
})
export class ProjectFormStartComponent implements OnInit, OnChanges {
  @Input() project: Project = new Project();
  @Input() Workspace: Workspace;
  @Input() NewWorkspace: boolean;
  @Input() workspaces: any[];
  @Input() getWorkspace: boolean;
  @Input() specProjType: any;
  @Output() availableOutput: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('addNewModal') public addNewModal: ModalDirective;
  typeOfProj = this.project ? this.project.projectType : 1;
  projectForm: FormGroup;
  workspaceForm: FormGroup;
  arraySpecTypes: any[] = [];
  selectedSpecType: any;
  workspaceSelectOpened = false;
  recentWorkspaces: Workspace[];
  addingNewWorkspace = false;
  submitted = false;
  selectedNewAiInterface: any;
  selectedNewExInterface: any;
  workspaceType = 'new';
  currentEditors: any[] = [];
  currentSimulators: any[] = [];
  // currentCompilers: string[] = [];
  currentRuntimes: any[];
  available: boolean = true;
  // editors = [
  //   { id: 1, name: 'Monaco Text', value: 'MONACO', for: ['APP', 'SERVICE', 'INTERFACE', 'DIGIBOT', 'ROBOT', 'COMPUTE_NODE', 'SERVICE'] },
  //   { id: 2, name: 'Blockly builder', value: 'BLOCKLY', for: ['APP', 'DIGIBOT', 'ROBOT', 'COMPUTE_NODE', 'SERVICE', 'DEVICE_NODE'] },
  //   { id: 3, name: 'UI Builder', value: 'UI', for: ['APP', 'ROBOT', 'SERVICE'] }
  // ];
  // simulators = [
  //   { id: 1, name: 'UI', value: 'UI', for: ['APP', 'SERVICE', 'ROBOT', 'SERVICE'] },
  //   { id: 2, name: '3D Environment', value: '3D', for: ['ROBOT', 'SERVICE'] },
  //   { id: 3, name: 'Device', value: 'DEVICE', for: ['ROBOT', 'COMPUTE_NODE', 'SERVICE', 'DEVICE_NODE'] },
  // ];
  // compiler: string;
  projectRunTime: string[] = [];
  projectLanguages: string[] = [];
  projectSubTypes: string[] = [];

  get formSimData() {
    return <FormArray>this.projectForm.get('simulatorsArray');
  }

  constructor(private formBuilder: FormBuilder,
              private projectsRestService: ProjectsRestService) {}

  ngOnInit() {
    this.NewWorkspace = true;

    this.getData();
    this.buildForm();
  }

  ngOnChanges() {
    if (this.workspaces && !this.Workspace.name) {
      this.Workspace.name = `My Workspace-${this.workspaces.length + 1}`;
    }
    
    this.getData();
    this.buildForm();

    if (this.project.runtime) {
      this.projectLanguages = this.specProjType?.value?.controls?.runtime?.options[this.project.runtime].languages;
    }

    // if (this.project.language) {
    //   this.showSelectedLanguage(this.project.language);
    // }
  }

  getData() {
    if (this.specProjType?.value) {
      this.project.projectType = this.specProjType?.key;
      this.projectRunTime = [];
      
      Object.entries(this.specProjType.value.controls.runtime.options).forEach((item: any) => {
        if (item[1]?.languages?.length) {
          this.projectRunTime.push(item[0]);
        }
      });

      if (this.specProjType.key === 'APP') {
        this.projectSubTypes = this.specProjType.value.controls.projectSubType.options;
      }
    }
  }

  buildForm() {
    this.projectForm = this.formBuilder.group({
      projectType: [this.project.projectType, Validators.required],
      projectSubType: [this.project.projectSubType],
      projectName: [this.project.name, Validators.required],
      newWorkspaceName: [''],
      selectSpecType: [this.selectedSpecType],
      selectLanguage: [this.project.language, Validators.required],
      selectRuntime: [this.project.runtime, Validators.required],
      selectEditor: [''],
      simulatorsArray: this.addCheckboxes(),
      summary: ['']
    });
    
    // if (this.specProjType.key === 'APP_COMPONENT') {
    //   this.projectForm?.get('selectRuntime').setValue('AOS_CLOUD');
    //   this.projectForm?.get('selectLanguage').setValue('JAVASCRIPT');
    //   this.projectForm?.get('selectLanguage').disable();
    //   this.projectForm?.get('selectRuntime').disable();
    // }  else {
    //   this.projectForm?.get('selectRuntime').enable();
    //   this.projectForm?.get('selectLanguage').enable();
    // }

    // this.addCheckboxes();
    if (!this.getWorkspace) {
      this.projectForm.controls['newWorkspaceName'].setValidators([]);
      this.projectForm.controls['newWorkspaceName'].updateValueAndValidity();
    }
    switch (this.specProjType) {
      case 'APP':
        this.projectForm.get('projectSubType').setValidators([Validators.required]);
        this.projectForm.updateValueAndValidity();
        break;
      default:
        this.projectForm.get('projectSubType').setValidators([]);
        this.projectForm.updateValueAndValidity();
    }

    this.projectForm.get('selectRuntime').valueChanges.subscribe(value => {      
      this.projectLanguages = this.specProjType?.value?.controls?.runtime?.options[value]?.languages;
      this.projectForm.get('selectLanguage').setValue(null);
    });

    this.projectForm.get('selectLanguage').valueChanges.subscribe(value => {
      this.project.language = value
    });

    this.projectForm.get('projectName').valueChanges.pipe(
      debounceTime(100),
      switchMap(name => this.projectsRestService.checkNameAvailability({ name }))).subscribe(value => {        
        this.available = value.available;
        this.availableOutput.emit(this.available)
      })

    this.projectForm?.get('selectRuntime').setValue(this.projectRunTime[0]);
    this.projectForm?.get('selectLanguage').setValue(this.projectLanguages[0]);

    if (this.specProjType.key === 'APP') {
      this.projectForm?.get('projectSubType').setValue(this.projectSubTypes[0]);
    }
  }

  toggleWorkspaceSelect(event: Event) {
    event.stopPropagation();
    this.workspaceSelectOpened = !this.workspaceSelectOpened;
  }


  addCheckboxes() {
    // if (this.currentSimulators.length) {
    //   const arr = this.currentSimulators.map((o, i) => {
    //     const values = this.project.simulators ?
    //       this.project.simulators.map(sim => sim.value) : this.currentSimulators.map(sim => sim.value);
    //     return this.formBuilder.control({ value: this.project.simulators ? values.includes(o.value) : false, disabled: false });
    //   });
    //   return this.formBuilder.array(arr);
    // }
  }

  // workspaceSelector(workspaceType: string) {
  //   this.workspaceType = workspaceType;
  //   this.projectForm.controls['selectWorkspace'].setValue('');
  //   this.projectForm.controls['newWorkspaceName'].setValue('');
  //   if (workspaceType === 'new') {
  //     this.NewWorkspace = true;
  //     this.projectForm.controls['newWorkspaceName'].setValidators([Validators.required]);
  //     this.projectForm.controls['newWorkspaceName'].updateValueAndValidity();
  //     this.projectForm.controls['selectWorkspace'].setValidators([]);
  //     this.projectForm.controls['selectWorkspace'].updateValueAndValidity();
  //   } else {
  //     this.NewWorkspace = false;
  //     this.projectForm.controls['selectWorkspace'].setValidators([Validators.required]);
  //     this.projectForm.controls['selectWorkspace'].updateValueAndValidity();
  //     this.projectForm.controls['newWorkspaceName'].setValidators([]);
  //     this.projectForm.controls['newWorkspaceName'].updateValueAndValidity();
  //   }
  // }

  onCheckNext() {
    this.submitted = true;
    if (this.projectForm.valid) {
      this.project.name = this.projectForm.controls['projectName'].value;
      if (this.projectForm.controls['projectSubType'].value) {
        this.project.projectSubType = this.projectForm.controls['projectSubType'].value;
      }
      this.project.runtime = (this.projectForm.controls['selectRuntime'].value as any);
      return true;
    }
    return false;
  }

  // showSelectedLanguage(language) {
  //   this.project.language = language;

  //   switch (language) {
  //     case 'BLOCK':
  //     case 'TYPESCRIPT':
  //     case 'JAVASCRIPT':
  //       this.compiler = 'NodeJS';
  //       break;
  //     case 'PYTHON':
  //       this.compiler = 'Python 3';
  //       break;
  //     case 'C':
  //       this.compiler = 'GCC';
  //       break;
  //     case 'C++':
  //       this.compiler = 'GCC';
  //       break;
  //   }
  // }

  changeExValue(ex) {
    ex.setValue(!ex.value);
  }

  // showSelectedSpecType(event) {
  //   this.selectedSpecType = event;
  //   switch (this.project.projectType) {
  //     case 'ROBOT':
  //       this.project.settings = {} as Settings;
  //       this.project.settings.robotType = event;
  //       break;
  //   }
  // }

  // toggleNewWorkspace(event: Event) {
  //   event.stopPropagation();
  //   this.addingNewWorkspace = !this.addingNewWorkspace;
  // }

  // addNewWorkspace() {
  //   this.Workspace.name = this.projectForm.controls['newWorkspaceName'].value;
  //   this.projectForm.controls['newWorkspaceName'].setValidators([Validators.required]);
  //   this.projectForm.controls['newWorkspaceName'].updateValueAndValidity();
  //   this.Workspace._id = undefined;
  //   this.addingNewWorkspace = !this.addingNewWorkspace;
  //   this.workspaceSelectOpened = !this.workspaceSelectOpened;
  // }

  // addWorkspace(workspace) {
  //   this.Workspace.name = workspace.name;
  //   this.projectForm.controls['newWorkspaceName'].setValidators([]);
  //   this.projectForm.controls['newWorkspaceName'].updateValueAndValidity();
  //   this.Workspace._id = workspace._id;
  //   this.addingNewWorkspace = false;
  //   this.workspaceSelectOpened = false;
  // }
}