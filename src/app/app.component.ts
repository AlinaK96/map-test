import { Component, ElementRef, ViewChild, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Group {
  Id: number;
  Name: string;
  EnterpriseId: number;
  ParentId: number | null;
}

export interface Type {
  Id: number;
  Name: string;
  EnterpriseId: number;
  GroupId: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  @ViewChild('treeContainer') treeContainer: ElementRef | undefined;

  groups: Group[] = [
    { "Id": 1, "Name": "string [Г]", "EnterpriseId": 0, "ParentId": null },
    { "Id": 2, "Name": "группа 1 [Г]", "EnterpriseId": 0, "ParentId": null },
    { "Id": 3, "Name": "группа 1 [Г]", "EnterpriseId": 0, "ParentId": null },
    { "Id": 7, "Name": "Группа №1 [Г]", "EnterpriseId": 4, "ParentId": null },
    { "Id": 8, "Name": "Группа №2 [Г]", "EnterpriseId": 4, "ParentId": 7 },
    { "Id": 9, "Name": "Группа №3 [Г]", "EnterpriseId": 4, "ParentId": 8 },
    { "Id": 10, "Name": "Группа №4 [Г]", "EnterpriseId": 4, "ParentId": 9 },
    { "Id": 11, "Name": "Группа №5 [Г]", "EnterpriseId": 4, "ParentId": 10 },
  ];

  types: Type[] = [
    { "Id": 1, "Name": "string [Т]", "EnterpriseId": 4, "GroupId": 1 },
    { "Id": 2, "Name": "string [Т]", "EnterpriseId": 4, "GroupId": 2 },
    { "Id": 3, "Name": "string [Т]", "EnterpriseId": 4, "GroupId": 3 },
    { "Id": 4, "Name": "string [Т]", "EnterpriseId": 4, "GroupId": 3 },
    { "Id": 5, "Name": "string [Т]", "EnterpriseId": 4, "GroupId": 3 },
    { "Id": 6, "Name": "Test [Т]", "EnterpriseId": 4, "GroupId": 11 }
  ];
  
  tree: any[] = [];
  selectedId: number | null = null;
  returnModel: any[] = [];

  ngOnInit(): void {
    this.buildTree();
  }

  buildTree() {
    const groupMap = new Map<number, Group>();
    this.groups.forEach(group => groupMap.set(group.Id, group));

    this.tree = this.groups
      .filter(group => group.ParentId === null)
      .map(group => this.buildGroupTree(group, groupMap));

    this.attachTypesToGroups();
  }

  buildGroupTree(group: Group, groupMap: Map<number, Group>): any {
    return {
      ...group,
      children: this.groups
        .filter(child => child.ParentId === group.Id)
        .map(child => this.buildGroupTree(child, groupMap))
    };
  }

  attachTypesToGroups() {
    const groupMap = new Map<number, any>();
    this.flattenTree(this.tree).forEach(group => {
      groupMap.set(group.Id, group);
    });

    this.types.forEach(type => {
      const group = groupMap.get(type.GroupId);
      if (group) {
        if (!group.types) {
          group.types = [];
        }
        group.types.push(type);
      }
    });
  }

  flattenTree(tree: any[]): any[] {
    return tree.reduce((acc, node) => {
      const children = node.children ? this.flattenTree(node.children) : [];
      return acc.concat(node, children);
    }, []);
  }

  handleGroupClick(id: number, group: any) {
    this.selectedId = id;
    this.returnModel = [{ type: 'group', id: id }];
    console.log(this.returnModel[0])
    group.isExpanded = !group.isExpanded;
  }

  handleTypeClick(id: number) {
    this.selectedId = id;
    this.returnModel = [{ type: 'type', id: id }];
    console.log(this.returnModel[0])

  }

  isSelected(id: number, type: 'group' | 'type'): boolean {
    return this.returnModel.some(item => item.type === type && item.id === id);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.treeContainer && !this.treeContainer.nativeElement.contains(event.target)) {
      this.clearSelection();
    }
  }

  clearSelection() {
    this.selectedId = null;
    this.returnModel = [];
  }
}
