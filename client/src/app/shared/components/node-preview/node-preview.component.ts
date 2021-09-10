import { SocketMetadata } from '@aitheon/system-graph';
import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';

export enum SocketPlacement {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  CENTER = 'CENTER',
}

export enum NodeType {
  USER_NODE = 'USER_NODE',
  CORE_NODE = 'CORE_NODE',
  SERVICE_NODE = 'SERVICE_NODE',
  LINKED = 'LINKED',
  TEMPLATE_NODE = 'TEMPLATE_NODE',
  TEXTAREA = 'TEXTAREA',
  IMAGE = 'IMAGE',
}

export enum GraphType {
  ORGANIZATION = 'ORGANIZATION',
  SERVICE = 'SERVICE',
  TEMPLATE = 'TEMPLATE',
  LINKED = 'LINKED',
  SUBGRAPH = 'SUBGRAPH',
  CORE = 'CORE',
}

interface PreviewIo {
  title: string;
  placement: SocketPlacement.LEFT | SocketPlacement.RIGHT | SocketPlacement.CENTER;
  type: 'INPUT' | 'OUTPUT';
}

@Component({
  selector: 'ai-node-preview',
  templateUrl: './node-preview.component.html',
  styleUrls: ['./node-preview.component.scss']
})
export class NodePreviewComponent implements OnInit, OnChanges {
  @Input() node: any;
  @Input() toolboxPreview = true;
  @Input() size: string;

  itemType = {
    ...GraphType,
    ...NodeType,
  };
  ioItems: PreviewIo[];
  placements = SocketPlacement;
  showMore: boolean;
  styles: {
    border: string,
    background: string,
  };
  logoUrl: string;

  private static prepareIo(io: SocketMetadata[] = [], type: 'INPUT' | 'OUTPUT' = 'INPUT') {
    return io.map(ioItem => ({
      io: ioItem,
      type,
    }));
  }

  ngOnInit(): void {
    this.createIoArray();
    this.setStyles();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.node && changes.node.currentValue) {
      this.setStyles();
      this.createIoArray();
    }
  }

  setStyles() {
    const { marketplaceSettings = {} }  = this.node || {};
      const { nodeStyling = {} } = marketplaceSettings || {};
      this.styles = {
        background: nodeStyling.backgroundColor,
        border: nodeStyling.borderColor
          ? `0.5px solid ${nodeStyling.borderColor.includes('transparent') ? '#454545' : nodeStyling.borderColor}`
          : null,
      };
      this.logoUrl = nodeStyling.logo
        ? nodeStyling.logo.url : null;
  }

  createIoArray() {
    const { inputs = [], outputs = [] } = this.node || {};
    this.ioItems = [
      ...NodePreviewComponent.prepareIo(inputs, 'INPUT'),
      ...NodePreviewComponent.prepareIo(outputs, 'OUTPUT')].map((ioItem) => {
      return {
        title: ioItem.io.name,
        placement: ioItem.io.placement
          ? ioItem.io.placement
          : (ioItem.type === 'INPUT' ? SocketPlacement.LEFT : SocketPlacement.RIGHT) as any,
        type: ioItem.type,
      };
    });
  }

  onDragStart(event: DragEvent, node: any) {
    const offset = {
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    };
    event.dataTransfer.setData('node', JSON.stringify(node));
    event.dataTransfer.setData('offset', JSON.stringify(offset));
  }

  onClickOutside(event: Event) {
    this.showMore = false;
  }

  toggleMore(event: Event) {
    this.stopEvent(event);
    this.showMore = !this.showMore;
  }

  stopEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }
}
