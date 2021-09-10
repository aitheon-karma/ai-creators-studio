import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFormRootComponent } from './project-form-root.component';

describe('ProjectFormRootComponent', () => {
  let component: ProjectFormRootComponent;
  let fixture: ComponentFixture<ProjectFormRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectFormRootComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectFormRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
