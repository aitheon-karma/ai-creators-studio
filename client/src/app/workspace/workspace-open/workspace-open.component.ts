import { Component, OnInit, Output, EventEmitter, Input, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkspacesRestService, Workspace } from '@aitheon/creators-studio';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'ai-workspace-open',
  templateUrl: './workspace-open.component.html',
  styleUrls: ['./workspace-open.component.scss']
})
export class WorkspaceOpenComponent implements OnInit, OnChanges {

  // tslint:disable-next-line:no-output-on-prefix
  @Output() onCancelModal: EventEmitter<Boolean> = new EventEmitter<Boolean>();
  @Input() workspacesLength: number;

  submitted = false;
  workspaceForm: FormGroup;
  loading = false;
  newWorkspaceName: string;

  constructor(
    private formBuilder: FormBuilder,
    private workspacesRestService: WorkspacesRestService,
    private toastr: ToastrService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.workspaceForm = this.formBuilder.group({
      newWorkspaceName: [this.newWorkspaceName, Validators.required],
    });

    // this.editorWebsocketService.workspaceLoad.subscribe((result: Workspace) => {
    //   if (result) {
    //     this.editorWebsocketService.sessionDetail.subscribe((session: Session) => {
    //       console.log('session', session);
    //       if (session.workspace._id === result._id) {
    //         this.loading = false;
    //         this.onCancelModal.emit(true);
    //         this.router.navigateByUrl('/workspace');
    //       } else {
    //         this.loading = false;
    //       }
    //     });
    //   }
    // });

  }

  ngOnChanges() {
    const number = this.workspacesLength ? this.workspacesLength + 1 : 1;
    this.newWorkspaceName = `My Workspace-${number}`;
  }

  onSubmit() {
    this.submitted = true;
    if (this.workspaceForm.invalid) {
      return;
    }
    this.loading = true;
    const newName = this.workspaceForm.value.newWorkspaceName;
    const newWorkspace = Object.assign({} as any, {workspace: {name: newName}});
    // this.editorWebsocketService.createWorkspace(newName);
      // this.loading = false;
      // this.onCancelModal.emit(true);
      // this.router.navigateByUrl('/workspace');
      // this.editorWebsocketService.sessionDetail.subscribe((session: Session) => {
      //   if (session.workspace.name === newName) {

      //   }
      // });
  }

  onCancel() {
    // this.editorWebsocketService.sessionDetail.unsubscribe();
    this.onCancelModal.emit(true);
  }
}
