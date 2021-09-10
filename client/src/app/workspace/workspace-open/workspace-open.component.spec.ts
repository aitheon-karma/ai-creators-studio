import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceOpenComponent } from './workspace-open.component';

describe('WorkspaceOpenComponent', () => {
  let component: WorkspaceOpenComponent;
  let fixture: ComponentFixture<WorkspaceOpenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkspaceOpenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceOpenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
