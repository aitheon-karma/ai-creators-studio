import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeStructureComponent } from './node-structure.component';

describe('NodeStructureComponent', () => {
  let component: NodeStructureComponent;
  let fixture: ComponentFixture<NodeStructureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeStructureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
