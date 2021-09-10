import { Component, OnInit, Output, EventEmitter, NO_ERRORS_SCHEMA, ViewChild, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Project, Workspace, ProjectsRestService } from '@aitheon/creators-studio';
@Component({
  selector: 'ai-project-form-root',
  templateUrl: './project-form-root.component.html',
  styleUrls: ['./project-form-root.component.scss']
})

export class ProjectFormRootComponent implements OnInit {
  @ViewChild('projectFormStart') projectFormStart: any;
  @ViewChild('projectFormApp') projectFormApp: any;
  @ViewChild('projectFormService') projectFormService: any;
  @ViewChild('projectFormDigibot') projectFormDigibot: any;
  @ViewChild('projectFormMechbot') projectFormMechbot: any;
  @ViewChild('projectFormMechbotNode') projectFormMechbotNode: any;
  @ViewChild('projectFormDevice') projectFormDevice: any;
  @ViewChild('projectFormSettings') projectFormSettings: any;
  @Input() workspaces: any[];
  @Input() getWorkspace: boolean;
  @Output() onClose: EventEmitter<Boolean> = new EventEmitter<Boolean>();
  @Output() onSaved: EventEmitter<Project> = new EventEmitter<Project>();

  project: Project;
  workspace: Workspace;
  newWorkspace = false;
  submitted = false;
  currentWorkspace: any;
  currentSession: any;
  currentProject: any;
  specProjType: string;
  projectForm: FormGroup;
  workspaceForm: FormGroup;
  onFinishCreate = false;
  projectNew: any;
  arrayTypes: any[];
  available: boolean = true;
  onNext: boolean;

  constructor(
    private projectsRestService: ProjectsRestService,
    private toastr: ToastrService,
    // private editorWebSocketService: EditorWebsocketService,
    // public editorService: EditorService
  ) {
    // console.log('this.currentSession  ---  .. ', this.currentSession);
    this.workspace = new Workspace();
    this.project = new Project();
    // this.editorWebSocketService.sessionDetail.subscribe((session) => {
    //   this.currentSession = session;
    // });
    // this.editorWebSocketService.workspaceLoad.subscribe((w: any) => {
    //   if (w && w.name === this.workspace.name) {
    //     this.editorWebSocketService.createProject(this.project);
    //     // this.editorService.projects.push(this.project);
    //     // this.currentSession = this.editorService.session;
    //     // this.currentProject = this.editorService.activeProject;
    //     this.toastr.success('Created Project ' + this.project.name);
    //     this.onClose.emit(true);
    //     this.router.navigateByUrl('workspace');
    //   }
    // });
  }

  ngOnInit() {
    // this.workflow = new Workflow();
    // this.workflow.length = 2;
    // this.workflow.state = 0;
    // this.workflow.finished = null;
  }

  projectTypeSelector(type: Project.ProjectTypeEnum) {
    this.project.projectType = type;
  }

  // next() {
  //   if (this.workflow.state === 0) {
  //     const onNext = this.projectFormStart.onCheckNext();
  //     if (!onNext) {
  //       return;
  //     }
  //     this.workflow.state++;
  //   }

  //   if (this.workflow.length != null && this.workflow.state === this.workflow.length - 1) {
  //     this.workflow.finished = true;
  //   } else {
  //     this.workflow.finished = false;
  //   }
  // }

  closeModal() {
    this.onClose.emit(true);
  }

  cancel() {
    this.onClose.emit(true);
  }

  finish() {
    if (!this.onNext) {
      return;
    }
    
    // Create and save Project
    // if (!this.getWorkspace) {
    //   this.workspace = this.editorService.session.workspace;
    // }
    // if (!this.projectFormSettings.onCheckNext()) {
    //   return;
    // }
    // console.log('Workspace: ', this.workspace);
    // this.project.aitheonInterfaces = this.project.aitheonInterfaces.map((ai) => ai.value);
    // this.project.externalInterfaces = this.project.externalInterfaces.map((ex) => ex.value);
    // stupid bug fix, need whooooole refactor guys
    if (this.project.language) {
      this.project.language = (this.project.language as any);
    }

    if (this.project.runtime) {
      this.project.runtime = (this.project.runtime as any);
    }
    // if (this.project.editor) {
    //   this.project.editor = this.project.editor.value;
    // }
    // this.project.simulators = this.project.simulators.map((ex) => ex.value);
    // switch (this.project.projectType) {
    //   case ProjectType.ROBOT:
    //     this.project.settings.robotType = this.project.settings.robotType['value'];
    //     break;
    // }
    
    this.projectsRestService.create(this.project).subscribe((result: Project) => {
      // console.log('Project: ', result);
      this.onClose.emit(true);
      this.onSaved.emit(result);
    }, (res) => {
      const message = res.error.message || 'Error';
      this.toastr.error(message);
    });

    // if (this.workspace._id === undefined) {
    //   this.editorWebSocketService.createWorkspace(this.workspace.name);
    // } else if (this.workspace._id && this.getWorkspace) {
    //   this.editorWebSocketService.loadWorkspace(this.workspace.name, this.workspace._id);
    // } else if (!this.getWorkspace) {
    //   this.editorWebSocketService.createProject(this.project);
    //   this.toastr.success('Created Project ' + this.project.name);
    //   this.onClose.emit(true);
    // }
  }

  projectApp() {
    const projectName = this.projectForm.get('project').value;
    this.submitted = true;
    if (this.projectForm.invalid) {
      return;
    }
  }

  changeType(event) {
    this.specProjType = event;
  }

  checkNameAvailable(available: boolean) {
    this.available = available;
    this.onNext = this.projectFormStart.onCheckNext();
  }
}