import { HostListener, Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Project } from "@aitheon/creators-studio";

interface DashboardProject extends Project {
  isMenuOpen?: boolean;
  isRecent?: boolean;
}

@Component({
  selector: 'ai-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss']
})
export class ProjectCardComponent implements OnInit {

  constructor() { }

  @Input() project: DashboardProject;
  @Output() openProject: EventEmitter<DashboardProject> = new EventEmitter<DashboardProject>();
  @Output() viewRepo: EventEmitter<DashboardProject> = new EventEmitter<DashboardProject>();
  @Output() deleteProject: EventEmitter<DashboardProject> = new EventEmitter<DashboardProject>();
  @Output() publishProject: EventEmitter<DashboardProject> = new EventEmitter<DashboardProject>();
  @Output() archiveProjectEvent: EventEmitter<DashboardProject> = new EventEmitter<DashboardProject>();
  @Output() activeProjectData: EventEmitter<any> = new EventEmitter<any>();

  ngOnInit() {
  }

  onOpenProject() {
    this.openProject.emit(this.project);
    this.clickedOutside();
  }

  onViewRepo(e: any) {
    this.stopBubbling(e);
    this.viewRepo.emit(this.project);
    this.clickedOutside();
  }

  onDelete(e: MouseEvent) {
    this.stopBubbling(e);
    this.deleteProject.emit(this.project);
    this.clickedOutside();
  }

  toggleMenu(e: MouseEvent) {
    this.stopBubbling(e);
    this.project.isMenuOpen = !this.project.isMenuOpen;
    if (this.project.isMenuOpen) {
      this.activeProjectData.emit({
        id: this.project._id,
        isRecent: !!this.project.isRecent
      });
    }
  }

  onPublish(e: MouseEvent) {
    this.stopBubbling(e);
    this.publishProject.emit(this.project);
    this.clickedOutside();
  }

  onArchiveEvent(e: MouseEvent) {
    this.stopBubbling(e);
    this.archiveProjectEvent.emit(this.project);
    this.clickedOutside();
  }

  clickedOutside() {
    this.project.isMenuOpen = false;
  }

  stopBubbling(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
  }
}
