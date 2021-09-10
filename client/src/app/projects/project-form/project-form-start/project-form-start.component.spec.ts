import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFormStartComponent } from './project-form-start.component';

describe('ProjectFormStartComponent', () => {
  let component: ProjectFormStartComponent;
  let fixture: ComponentFixture<ProjectFormStartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectFormStartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectFormStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
