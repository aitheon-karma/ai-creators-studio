import { Component, OnInit, Output, EventEmitter, Input, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Workspace, WorkspacesRestService, Project, ProjectsRestService } from '@aitheon/creators-studio';
// import { EditorWebsocketService } from '../../editor/shared/editor.websocket.service';
// import { EditorService } from '../../editor/shared/editor.service';

@Component({
  selector: 'ai-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {

  // tslint:disable-next-line:no-output-on-prefix
  @Output() onCloseOpenProject: EventEmitter<Boolean> = new EventEmitter<Boolean>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onSaved: EventEmitter<any> = new EventEmitter<any>();
  @Input() workspaces: any[];
  @Input() getWorkspace: boolean;
  @Input() currentProject: Project;
  projects: Project[];
  recents: Project[];
  recentWorkspaces: Workspace[];
  workspaceSelectOpened = false;
  addingNewWorkspace = false;
  isWorkspaceLoad = false;
  // currentProject: Project;
  currentWorkspace: Workspace;
  projectWorkspaces: Workspace[];
  projectWorkspace: Workspace = {} as Workspace;
  loading = true;
  selectedType = 'current';
  selectedWorkspace: Workspace;
  chosenWorkspace: Workspace;
  currentSession: any;
  selectedProject = {} as Project;

  constructor(
    private projectsRestService: ProjectsRestService,
    private router: Router,
    // private editorWebSocketService: EditorWebsocketService,
    // public editorService: EditorService,
    private workspacesRestService: WorkspacesRestService,
  ) { }

  ngOnInit() {
    this.projectsRestService.list().subscribe((result: Project[]) => {
      this.loading = false;
      this.projects = result;
    },
      err => {
        this.loading = false;
      });
    this.workspacesRestService.recent().subscribe((result: Workspace[]) => {
      this.loading = false;
      this.recentWorkspaces = result;
    },
      err => {
        this.loading = false;
      });
    this.projectsRestService.recent().subscribe((result: Project[]) => {
      this.loading = false;
      this.recents = result;
    },
      err => {
        this.loading = false;
      });
    // this.editorWebSocketService.sessionDetail.subscribe((s: Session) => {
    //   if (!s) {
    //     return;
    //   }
    //   if (s.workspace) {
    //     this.isWorkspaceLoad = true;
    //     this.currentWorkspace = this.workspaces.find((ws) => {
    //     return ws._id === s.workspace._id;
    //   });
    //   this.projectWorkspace = Object.assign({}, this.currentWorkspace);
    //   this.onSaved.emit({workspace: this.projectWorkspace, project: this.currentProject, isCurrent: true});
    //   }
    //   this.session = s;
    // });
    // if (this.currentProject) {
    //   this.projectWorkspaces = this.workspaces.filter((ws) => {
    //     return ws.projects.includes(this.currentProject._id);
    //   });
    // }
  }

  openProject(project) {
    // this.onCloseOpenProject.emit(true);
    // this.router.navigate(['workspace', 'workspace._id']);
    this.selectedProject = project;
    this.currentProject = project;
    if (!this.getWorkspace) {
      return;
    }

  }

  onCancel() {
    this.onCloseOpenProject.emit(true);
  }

  workspaceSelector(type) {
    this.chosenWorkspace = undefined;
    this.projectWorkspace = undefined;
    this.selectedType = type;
  }

  showSelected(event) {
    this.chosenWorkspace = event;
    this.selectedType = 'existing';
  }

  showSelectedCurrent(event) {
    this.projectWorkspace = event;
    this.selectedType = 'currentForProj';
  }

  openProjectFinish() {
    console.log(this.selectedType);
    // if (!this.getWorkspace) {
    //   this.editorWebSocketService.loadProject(this.selectedProject);
    //   // this.currentProject = undefined;
    //   this.onCloseOpenProject.emit(true);
    //   return;
    // }
    switch (this.selectedType) {
      case 'currentForProj':
        this.selectedWorkspace = this.projectWorkspace;
        break;
      case 'new':
        this.selectedWorkspace = { name: 'temporary', _id: 'temporary' } as Workspace;
        break;
      case 'existing':
        if (this.chosenWorkspace) {
          this.selectedWorkspace = this.chosenWorkspace;
        } else {
          this.selectedWorkspace = undefined;
        }
        break;
      // default:
      //   this.selectedWorkspace = this.workspace;
    }
    console.log('this.selectedWorkspace  --> ', this.selectedWorkspace);
    if (!this.selectedWorkspace) {
      return;
    }
    // if (this.selectedType !== 'current') {
    //   this.editorWebSocketService.loadWorkspace(this.selectedWorkspace.name, this.selectedWorkspace._id);
    // }
    // this.editorWebSocketService.loadProject(this.currentProject);
    this.onCloseOpenProject.emit(true);
    this.router.navigateByUrl('workspace');
  }

  showSelectedProject(project) {
    this.selectedProject = project;
  }

  openProjectNext() {
    this.projectWorkspaces = this.workspaces.filter((ws) => {
      return ws.projects.includes(this.selectedProject._id);
    });
    this.currentProject = this.selectedProject;
  }

  toggleWorkspaceSelect(event: Event) {
    event.stopPropagation();
    this.workspaceSelectOpened = !this.workspaceSelectOpened;
  }

  toggleNewWorkspace(event: Event) {
    event.stopPropagation();
    this.addingNewWorkspace = !this.addingNewWorkspace;
  }

  addNewWorkspace() {
    this.projectWorkspace = Object.assign({} as Workspace, { name: this.projectWorkspace.name });
    this.addingNewWorkspace = !this.addingNewWorkspace;
    this.workspaceSelectOpened = !this.workspaceSelectOpened;
    this.onSaved.emit({ workspace: this.projectWorkspace, project: this.currentProject, isCurrent: false });
    console.log(this.projectWorkspace);
  }

  addWorkspace(workspace) {
    this.projectWorkspace.name = workspace.name;
    this.projectWorkspace._id = workspace._id;
    this.onSaved.emit({ workspace: this.projectWorkspace, project: this.currentProject, isCurrent: false });
    console.log(this.projectWorkspace);
    this.addingNewWorkspace = false;
    this.workspaceSelectOpened = false;
  }

}
