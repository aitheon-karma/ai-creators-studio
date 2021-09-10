import { Component, OnInit, ViewChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Workspace, Project, ProjectsRestService } from '@aitheon/creators-studio';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-content-delete',
  templateUrl: './content-delete.component.html',
  styleUrls: ['./content-delete.component.scss']
})
export class ContentDeleteComponent implements OnInit {

  @ViewChild('deleteModalTempalate') deleteModalTempalate: TemplateRef<any>;
  @Output() deleted = new EventEmitter<string>();

  modalRef: BsModalRef;
  deleteEvent: { content: Project | Workspace, type?: string };
  deleteType: String;

  constructor(
    // public editorService: EditorService,
    // private editorWebsocketService: EditorWebsocketService,
    private modalService: BsModalService,
    private toastr: ToastrService,
    private projectsRestService: ProjectsRestService
  ) { }

  ngOnInit() {
  }

  show(event: { content:  Project | Workspace, type?: string }) {
    this.deleteEvent = event;
    if (this.deleteEvent.type === 'project') {
      this.deleteType = 'project';
    } else if (this.deleteEvent.type === 'workspace') {
      this.deleteType = 'workspace';
    }
    this.modalRef = this.modalService.show(this.deleteModalTempalate, { class: '' });
  }

  confirmDelete(): void {
    // if (this.deleteEvent.content instanceof Content) {
    //   this.editorService.deleteContent(this.deleteEvent.content, this.deleteEvent.parentList);
    // } else if (this.deleteEvent.type === 'project') {
    //   this.editorService.closeFilesOnDeleteProject(this.deleteEvent.content._id);
    //   this.editorWebsocketService.archiveProject(this.deleteEvent.content.name, this.deleteEvent.content._id);
    // } else if (this.deleteEvent.type === 'workspace') {
    //   this.editorWebsocketService.archiveWorkspace(this.deleteEvent.content.name, this.deleteEvent.content._id);
    // }
    if (this.deleteEvent.type === 'project') {
      this.projectsRestService.update(this.deleteEvent.content._id, { archived: true } as Project).subscribe(() => {
        this.modalRef.hide();
        this.deleted.emit(this.deleteEvent.content._id);
      },
      err => this.toastr.error(err.error.message));
    } else {
      this.modalRef.hide();
    }

  }

  cancelDelete(): void {
    this.modalRef.hide();
  }


}
