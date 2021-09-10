import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { WorkspacesRestService, Workspace } from '@aitheon/creators-studio';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
// import { EditorWebsocketService } from '../../editor/shared/editor.websocket.service';

@Component({
  selector: 'ai-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss']
})
export class WorkspaceListComponent implements OnInit {

  // tslint:disable-next-line:no-output-on-prefix
  @Output() onCloseOpenWorkspace: EventEmitter<Boolean> = new EventEmitter<Boolean>();
  @Input() workspaces: any[];
  loading = true;
  recentWorkspaces: Workspace[];
  selectedWorkspace = {} as Workspace;

  constructor(
    private workspacesRestService: WorkspacesRestService,
    private toastr: ToastrService,
    private router: Router,
    // private editorWebSocketService: EditorWebsocketService,
  ) { }

  ngOnInit() {
    // this.loading = true;
    // this.workspaceService.list().subscribe((result) => {
    //   this.loading = false;
    //   this.workspaces = result;
    //   console.log('this.worspaces  --> ', this.workspaces);
    // },
    // err => {
    //   console.log('Error with loading');
    //   this.loading = false;
    // });
    this.workspacesRestService.recent().subscribe((result: Workspace[]) => {
      this.loading = false;
      this.recentWorkspaces = result;
    },
      err => {
        this.loading = false;
      });

      // this.editorWebSocketService.workspaceLoad.subscribe((result: Workspace) => {
      //   if (result) {
      //     this.editorWebSocketService.sessionDetail.subscribe((session: Session) => {
      //       console.log('session', session);
      //       if (session.workspace._id === result._id) {
      //         this.loading = false;
      //         this.onCloseOpenWorkspace.emit(true);
      //         this.router.navigateByUrl('/workspace');
      //       } else {
      //         this.loading = false;
      //       }
      //     });
      //   }
      // });

  }

  openWorkspace(workspace) {
    this.selectedWorkspace = workspace;
  }

  onCancel() {
    this.onCloseOpenWorkspace.emit(true);
  }

  showSelectedWorkspace(workspace) {
    this.selectedWorkspace = workspace;
  }

  openWorkspaceFinish() {
    // this.editorWebSocketService.loadWorkspace(this.selectedWorkspace.name, this.selectedWorkspace._id);
  }

}
