/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Arr, Obj, Optional } from '@ephox/katamari';
import { SugarElement, Width } from '@ephox/sugar';

import Editor from 'tinymce/core/api/Editor';
import { EditorOptions } from 'tinymce/core/api/OptionTypes';

export type TableSizingMode = 'fixed' | 'relative' | 'responsive' | 'auto';
export type TableColumnResizing = 'preservetable' | 'resizetable';
export type TableHeaderType = 'section' | 'cells' | 'sectionCells' | 'auto';

const option: {
  <K extends keyof EditorOptions>(name: K): (editor: Editor) => EditorOptions[K] | undefined;
  <T>(name: string): (editor: Editor) => T | undefined;
} = (name: string) => (editor: Editor) =>
  editor.options.get(name);

// Note: This is also contained in the table plugin Options.ts file
const determineDefaultTableStyles = (editor: Editor, defaultStyles: Record<string, string>): Record<string, string> => {
  if (isTablePixelsForced(editor)) {
    // Determine the inner size of the parent block element where the table will be inserted
    const dom = editor.dom;
    const parentBlock = dom.getParent<HTMLElement>(editor.selection.getStart(), dom.isBlock) ?? editor.getBody();
    const contentWidth = Width.getInner(SugarElement.fromDom(parentBlock));
    return { ...defaultStyles, width: contentWidth + 'px' };
  } else if (isTableResponsiveForced(editor)) {
    return Obj.filter(defaultStyles, (_value, key) => key !== 'width');
  } else {
    return defaultStyles;
  }
};

const register = (editor: Editor): void => {
  const registerOption = editor.options.register;

  registerOption('table_clone_elements', {
    processor: 'string[]'
  });

  registerOption('table_use_colgroups', {
    processor: 'boolean',
    default: true
  });

  registerOption('table_header_type', {
    processor: (value) => {
      const valid = Arr.contains([ 'section', 'cells', 'sectionCells', 'auto' ], value);
      return valid ? { value, valid } : { valid: false, message: 'Must be one of: section, cells, sectionCells or auto.' };
    },
    default: 'section'
  });

  registerOption('table_sizing_mode', {
    processor: 'string',
    default: 'auto'
  });

  registerOption('table_default_attributes', {
    processor: 'object',
    default: {
      border: '1'
    }
  });

  registerOption('table_default_styles', {
    processor: 'object',
    default: {
      'border-collapse': 'collapse',
      'width': '100%'
    }
  });

  registerOption('table_column_resizing', {
    processor: (value) => {
      const valid = Arr.contains([ 'preservetable', 'resizetable' ], value);
      return valid ? { value, valid } : { valid: false, message: 'Must be preservetable, or resizetable.' };
    },
    default: 'preservetable'
  });

  registerOption('table_resize_bars', {
    processor: 'boolean',
    default: true
  });
};

const getTableCloneElements = (editor: Editor): Optional<string[]> => {
  return Optional.from(editor.options.get('table_clone_elements'));
};

const hasTableObjectResizing = (editor: Editor): boolean => {
  const objectResizing = editor.options.get('object_resizing');
  return Arr.contains(objectResizing.split(','), 'table');
};

const getTableHeaderType = option<TableHeaderType>('table_header_type');

const getTableColumnResizingBehaviour = option<TableColumnResizing>('table_column_resizing');

const isPreserveTableColumnResizing = (editor: Editor): boolean =>
  getTableColumnResizingBehaviour(editor) === 'preservetable';

const isResizeTableColumnResizing = (editor: Editor): boolean =>
  getTableColumnResizingBehaviour(editor) === 'resizetable';

const getTableSizingMode = option<TableSizingMode>('table_sizing_mode');

const isTablePercentagesForced = (editor: Editor): boolean =>
  getTableSizingMode(editor) === 'relative';

const isTablePixelsForced = (editor: Editor): boolean =>
  getTableSizingMode(editor) === 'fixed';

const isTableResponsiveForced = (editor: Editor): boolean =>
  getTableSizingMode(editor) === 'responsive';

const hasTableResizeBars = option<boolean>('table_resize_bars');

const getTableDefaultAttributes = option<Record<string, string>>('table_default_attributes');

const getTableDefaultStyles = (editor: Editor): Record<string, string> => {
  // Note: The we don't rely on the default here as we need to dynamically lookup the widths based on the current editor state
  const options = editor.options;
  const defaultStyles = options.get('table_default_styles');
  return options.isSet('table_default_styles') ? defaultStyles : determineDefaultTableStyles(editor, defaultStyles);
};

const tableUseColumnGroup = option<boolean>('table_use_colgroups');

export {
  register,

  getTableCloneElements,
  isTablePercentagesForced,
  isTablePixelsForced,
  isTableResponsiveForced,
  getTableHeaderType,
  getTableColumnResizingBehaviour,
  isPreserveTableColumnResizing,
  isResizeTableColumnResizing,
  hasTableObjectResizing,
  hasTableResizeBars,
  getTableDefaultAttributes,
  getTableDefaultStyles,
  tableUseColumnGroup
};
