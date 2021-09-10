import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AuthService } from '@aitheon/core-client';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import {
  MarketplaceSettings,
  MarketplaceSettingsRestService,
  Project,
  ProjectsRestService,
  Sandbox,
  SandboxesRestService,
  Workspace,
  WorkspacesRestService
} from '@aitheon/creators-studio';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Tutorial, TutorialsRestService } from '@aitheon/platform-support';
import { GenericConfirmComponent } from '../shared/generic-confirm/generic-confirm.component';
import { SharedService } from '../shared/shared.service';
import { Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';

interface DashboardProject extends Project {
  isMenuOpen?: boolean;
  isRecent?: boolean;
}

@Component({
  selector: 'ai-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {

  projectsModalRef: BsModalRef;
  newWorkspaceModalRef: BsModalRef;
  openWorkspaceModalRef: BsModalRef;
  openProjectModalRef: BsModalRef;
  @ViewChild('newProjectModal') projectsModal: TemplateRef<any>;
  @ViewChild('newWorkspaceModal') newWorkspaceModal: TemplateRef<any>;
  @ViewChild('openWorkspaceModal') openWorkspaceModal: TemplateRef<any>;
  @ViewChild('openProjectModal') openProjectModal: TemplateRef<any>;
  @ViewChild('workspaceOpenModal') workspaceOpenModal: TemplateRef<any>;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  @ViewChild('settingsProjectModal') settingsProjectModal: TemplateRef<any>;
  @ViewChild('projectList') projectList: any;
  currentOrganization: any;
  currentUser: any;
  workspaces: Workspace[];
  projects: DashboardProject[] = [];
  defaultProjects: DashboardProject[] = [];
  defaultArchiveProjects: DashboardProject[] = [];
  getWorkspace = true;
  loading = true;
  recents: DashboardProject[];
  recentWorkspaces: Workspace[];
  currentProject: Project;
  sortType = 'name';
  currentWorkspaceFromModal: Workspace;
  currentProjectFromModal: Project;
  currentLoadFromModal: boolean;
  submitted = false;
  tutorials: Tutorial[];
  activeProject: any;
  editWorkspaceMode = false;
  showAll = false;
  marketplaceSettings: MarketplaceSettings = new MarketplaceSettings;
  subscriptions: Subscription[] = [];
  selectedProjectId: string;
  dashboardTab = 'PROJECTS';
  archiveProjects: DashboardProject[] = [];
  projectMenuOpen = false;
  searchControl: FormControl;

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (this.projectMenuOpen) {
      [...this.archiveProjects, ...this.projects, ...this.recents].forEach(project => {
        if (project.isMenuOpen) {
          project.isMenuOpen = false;
        }
      });
      this.projectMenuOpen = false;
    }
  }

  constructor(
    public authService: AuthService,
    private modalService: BsModalService,
    private workspacesRestService: WorkspacesRestService,
    private projectsRestService: ProjectsRestService,
    private tutorialsRestService: TutorialsRestService,
    private router: Router,
    private toastr: ToastrService,
    private marketplaceSettingsRestService: MarketplaceSettingsRestService,
    private sharedService: SharedService,
    private sandboxesRestService: SandboxesRestService,
  ) {
  }

  ngOnInit() {
    this.subscriptions.push(this.authService.activeOrganization.subscribe((organization: any) => {
      this.currentOrganization = organization;
    }));

    this.loadProjectsList();

    this.subscriptions.push(this.authService.currentUser.subscribe((user: any) => {
      this.currentUser = user;
    }));

    this.subscriptions.push(this.workspacesRestService.list().subscribe((result) => {
      this.workspaces = result;
    }));

    this.subscriptions.push(this.projectsRestService.recent().subscribe((result: Project[]) => {
        this.recents = result;
        this.recents.map(project => {
          project.isMenuOpen = false;
          project.isRecent = true;

          return project;
        });
        this.loading = false;
      },
      err => {
        console.error(err);
        this.loading = false;
      }));

    this.subscriptions.push(this.workspacesRestService.recent().subscribe((result: Workspace[]) => {
        this.loading = false;
        this.recentWorkspaces = result;
      },
      err => {
        console.error(err);
        this.loading = false;
      }));

    this.buildSearchControl();
  }

  loadProjectsList() {
    const projectsRequest = this.projectsRestService.search('', '', true, this.sortType, false, '', false);
    const archiveProjectsRequest = this.projectsRestService.search('', '', true, this.sortType, false, '', true);

    this.subscriptions.push(
      forkJoin([projectsRequest, archiveProjectsRequest]).subscribe(([projects, archiveProjects]) => {
        this.filterProjects([...projects, ...archiveProjects]);
        this.loading = false;
      }, err => {
        console.error(err);
        this.loading = false;
      }));
  }

  onDelete(projectId: string) {
    this.loading = true;
    const unArchivedPr = this.projects.find(p => projectId === p._id);
    const unArchivedRecentPrIndex = this.recents.findIndex(p => projectId === p._id);
    if (unArchivedPr) {
      unArchivedPr.archived = true;
    }
    if (unArchivedRecentPrIndex !== -1) {
      this.recents.splice(unArchivedRecentPrIndex, 1);
    }
    this.filterProjects([...this.projects, ...this.archiveProjects]);
    this.loading = false;
  }

  newProject() {
    this.projectsModalRef = this.modalService.show(this.projectsModal,
      Object.assign({}, { class: 'modal-xxl', id: 'newProjModel' })
    );
  }

  openWorkspace() {
    this.openWorkspaceModalRef = this.modalService.show(this.openWorkspaceModal,
      Object.assign({}, { class: 'modal-lg' })
    );
  }

  createRandomWorkspace() {
    this.newWorkspaceModalRef = this.modalService.show(this.newWorkspaceModal,
      Object.assign({}, { class: 'modal-md' })
    );
  }

  showDeleteContent(data: { content: Project, parentList: any, type: string }) {
    this.genericConfirm.show({
      text: `Are you sure you want to move ${data.content.name} project to archive?`,
      headlineText: 'Archive project',
      confirmText: `Archive`,
      callback: () => {
        this.onDelete(data.content._id);
      }
    });
  }

  closeModal(modalRef: BsModalRef) {
    modalRef.hide();
    this.loadProjectsList();
    this.submitted = false;
  }

  openRecentProject(recent) {
    this.currentProject = recent;
    this.subscriptions.push(this.sandboxesRestService.active().subscribe((sandbox: Sandbox) => {
      if (sandbox) {
        return this.router.navigate(['sandboxes', sandbox._id], { queryParams: { projectId: recent._id } });
      } else {
        this.selectedProjectId = recent._id;
        this.openProjectModalRef = this.modalService.show(this.openProjectModal,
          Object.assign({}, { class: 'modal-sandbox' })
        );
      }
    }));
  }

  openRecentWorkspace(workspace) {
    // this.editorWebsocketService.loadWorkspace(workspace.name, workspace._id);
    // const session$ = this.editorWebsocketService.sessionDetail.subscribe((session) => {
    //   if (session.workspace) {
    //     this.router.navigateByUrl('/workspace');
    //       session$.unsubscribe();
    //   }
    // });
  }

  sortSelector(type: string) {
    this.loading = true;
    this.sortType = type;
    this.listProjectsBySort(type);
  }

  listProjectsBySort(type: string) {
    const filterBy = type === 'name';
    this.subscriptions.push(this.projectsRestService.search('', '', filterBy, '', !filterBy).subscribe((projects: Project[]) => {
      this.projects = projects;
      this.loading = false;
    }));
  }

  onWorkspaceSelect(event) {
    this.currentWorkspaceFromModal = event.workspace;
    this.currentProjectFromModal = event.project;
    this.currentLoadFromModal = event.isCurrent;
  }

  openProjectFinish() {
    this.submitted = true;
    // if (!this.currentWorkspaceFromModal) {
    //   this.toastr.error('Need to select a Workspace');
    //   return;
    // }
    // if (!this.currentWorkspaceFromModal._id) {
    //   this.editorWebsocketService.createWorkspace(this.currentWorkspaceFromModal.name);
    // }
    // if (!this.currentLoadFromModal) {
    //   this.editorWebsocketService.loadWorkspace(this.currentWorkspaceFromModal.name, this.currentWorkspaceFromModal._id);
    // } else {
    //   this.editorWebsocketService.loadProject(this.currentProject);
    //   this.router.navigateByUrl('workspace');
    // }
    const owner = this.currentOrganization ? this.currentOrganization._id : this.currentUser._id;
    this.router.navigateByUrl(`/repositories/${owner}/${this.currentProject.slug}`).then();
    this.openProjectModalRef.hide();
  }

  toggleProjectMenu(event: Event, recent: any) {
    event.preventDefault();
    event.stopPropagation();
    if (this.activeProject && (this.activeProject !== recent._id)) {
      this.activeProject.isMenuOpen = false;
    }
    this.activeProject = recent;
    recent.isMenuOpen = !recent.isMenuOpen;
  }

  onEditWorkspaceMode() {
    this.editWorkspaceMode = true;
  }

  offEditWorkspaceMode() {
    this.editWorkspaceMode = false;
  }

  openMarketSettingsModal(project: Project) {
    this.loading = false;

    this.sharedService.openModal('REQUEST_MODAL', {
      type: 'PROJECT',
      data: project,
    });
  }

  toggleWorkspaces() {
    this.showAll = !this.showAll;
  }

  getSettings(settings: MarketplaceSettings) {
    this.marketplaceSettings = settings;
  }

  stopEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  openProject(project: any) {
    this.currentProject = project;
    const owner = this.currentOrganization ? this.currentOrganization._id : this.currentUser._id;
    this.router.navigateByUrl(`/repositories/${owner}/${this.currentProject.slug}`).then();
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      try {
        subscription.unsubscribe();
      } catch (e) {
      }
    }
  }

  switchTab(tab: string) {
    this.dashboardTab = tab;
    if (tab === 'PROJECTS') {
      this.sortSelector('name');
    }
    this.clearSearchValue();
  }

  projectDataChanged(projectData: any) {
    [...this.archiveProjects, ...this.projects, ...this.recents].forEach(project => {
      project.isMenuOpen = project._id === projectData.id;
    });
    if (projectData.isRecent) {
      const projectToFind = this.projects.find(project => project._id === projectData.id);
      projectToFind.isMenuOpen = false;
    } else {
      const projectToFind = this.recents.find(project => project._id === projectData.id);
      if (projectToFind) {
        projectToFind.isMenuOpen = false;
      }
    }
    this.projectMenuOpen = true;
  }

  archiveProject(project: DashboardProject) {
    this.loading = true;
    if (project.archived) {
      this.projectsRestService.update(project._id, { archived: false } as Project).subscribe(() => {
          const archivedPr = this.archiveProjects.find(p => project._id === p._id);
          if (archivedPr) {
            archivedPr.archived = false;
          }
          this.filterProjects([...this.projects, ...this.archiveProjects]);
          this.loading = false;
        },
        err => this.toastr.error(err.error.message));
    }
  }

  clearSearchValue(event?: Event): void {
    if (event) {
      this.stopEvent(event);
    }
    this.searchControl.reset();
  }

  private filterProjects(result: Project[]) {
    this.archiveProjects = [];
    this.projects = [];
    result.map(project => {
      project['isMenuOpen'] = false;
      project.archived === true ? this.archiveProjects.push(project) : this.projects.push(project)
    });
    this.cacheDefaultProjects();
  }

  private buildSearchControl(): void {
    this.searchControl = new FormControl('');

    this.addDebounceToSearch();
  }

  private addDebounceToSearch(): void {
    this.subscriptions.push(
      this.searchControl.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          tap(val => this.loading = true)
        )
        .subscribe(value => {
          this.updateProjects(value);
        }));
  }

  private updateProjects(value: string): void {
    if (this.dashboardTab === 'PROJECTS') {
      this.projects = value
        ? this.defaultProjects.filter(project => project.name.includes(value))
        : this.defaultProjects;
    } else {
      this.archiveProjects = value
        ? this.defaultArchiveProjects.filter(project => project.name.includes(value))
        : this.defaultArchiveProjects;
    }
    this.loading = false;
  }

  private cacheDefaultProjects(): void {
    if (!this.defaultProjects.length) {
      this.defaultProjects = [...this.projects];
    }

    if (!this.defaultArchiveProjects.length) {
      this.defaultArchiveProjects = [...this.archiveProjects];
    }
  }
}
