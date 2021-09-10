import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectComponentInstallerComponent } from './project-component-installer.component';

describe('ProjectComponentInstallerComponent', () => {
  let component: ProjectComponentInstallerComponent;
  let fixture: ComponentFixture<ProjectComponentInstallerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectComponentInstallerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectComponentInstallerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
