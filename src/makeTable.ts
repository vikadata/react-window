import { createElement } from "react";
import { defaultItemKey, defaultItemRowKey, defaultRowClassName, Props, RenderComponent } from "./createGridComponent";


type IVisibleRange = {
  columnStartIndex: number;
  columnStopIndex: number;
  rowStartIndex: number;
  rowStopIndex: number;
}

enum CellType {
  head = 'head',
  body = 'body',
  foot = 'foot',
}

interface IMakeTableProps {
  props: Props<any>;
  visibleRange: IVisibleRange;
  _instanceProps: any;
  getEstimatedTotalWidth: any;
  getColumnWidth: any;
  getRowHeight: any;
  _getItemStyle: any;
  isScrolling: boolean;
}


const resetCellStyle = (style: React.CSSProperties, type: CellType, footerHeight?: number) => {
  return {
    ...style,
    height: type === CellType.foot ? footerHeight || style.height : style.height,
  }
}

export function makeTable(args: IMakeTableProps) {
  const { props, visibleRange, _instanceProps, getEstimatedTotalWidth, getColumnWidth, getRowHeight, _getItemStyle, isScrolling } = args;
  const { rowStartIndex, rowStopIndex, columnStartIndex, columnStopIndex } = visibleRange;
  const {
    children,
    headerCellRender,
    className,
    columnCount,
    direction,
    height,
    itemData,
    itemKey = defaultItemKey,
    itemRowKey = defaultItemRowKey,
    rowCount,
    style,
    useIsScrolling,
    width,
    frozenColCount = 0,
    footerCellRender,
    footerHeight,
    rowClassName = defaultRowClassName,
  } = props;
  const estimatedTotalWidth = getEstimatedTotalWidth(props, _instanceProps);

  let thead;
  let tbody;
  let tfoot;

  function createRow(rowIndex: number, cellRender: RenderComponent<any>, type: CellType) {
    const rowChildren = [];
    // 处理冻结列
    const frozenColElements: any[] = [];
    let frozenColWidth = 0;
    let thisRowTop;
    [...Array(frozenColCount).keys()].forEach((item, columnIndex) => {
      frozenColWidth += getColumnWidth(props, columnIndex, _instanceProps)
      const { top, ...style } = _getItemStyle(rowIndex, columnIndex) as React.CSSProperties;
      thisRowTop = top;
      frozenColElements.push(
        createElement(cellRender, {
          columnIndex,
          data: itemData,
          isScrolling: useIsScrolling ? isScrolling : undefined,
          key: itemKey!({ columnIndex, data: itemData, rowIndex }),
          rowIndex,
          style: resetCellStyle(style, type, footerHeight)
        })
      )
    })
    const frozenCol = createElement(
      'div',
      {
        role: 'frozen-col',
        style: {
          position: 'sticky',
          left: 0,
          width: frozenColWidth,
          height: type === CellType.foot ? footerHeight || getRowHeight(props, rowIndex, _instanceProps) : getRowHeight(props, rowIndex, _instanceProps),
          zIndex: 2,
        }
      },
      ...frozenColElements,
    )

    if (frozenColCount > 0) rowChildren.push(frozenCol);

    for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
      if (columnIndex < frozenColCount) continue;
      const { top, ...style } = _getItemStyle(rowIndex, columnIndex) as React.CSSProperties;
      rowChildren.push(
        createElement(cellRender, {
          columnIndex,
          data: itemData,
          isScrolling: useIsScrolling ? isScrolling : undefined,
          key: itemKey!({ columnIndex, data: itemData, rowIndex }),
          rowIndex,
          style: resetCellStyle(style, type, footerHeight)
        })
      );
    }
    let rowPosition = 'absolute';
    let zIndex = 1;
    let headerStyle = {};
    if (type === CellType.head) {
      rowPosition = 'sticky';
      zIndex = 2;
      headerStyle = {
        top: 0,
      }
    }
    const rowEle = createElement('div', {
      key: itemRowKey!({ data: itemData, rowIndex }),
      'data-record-id': itemRowKey!({ data: itemData, rowIndex }),
      style: {
        transform: `translateY(${thisRowTop}px)`,
        position: rowPosition,
        display: 'inline-flex',
        width: estimatedTotalWidth,
        zIndex,
        ...headerStyle,
      },
      className: rowClassName({ rowIndex, data: itemData }),
    }, ...rowChildren);
    return rowEle;
  }

  // header
  if (headerCellRender) {
    const theadEle = createRow(0, headerCellRender as any, CellType.head);
    thead = theadEle;
  }

  // body
  const tbodyRows = [];
  for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
    if (rowIndex > 0) {
      tbodyRows.push(createRow(rowIndex, children as any, CellType.body))
    }
  }
  tbody = createElement(
    'div',
    {
      role: 'table-body',
      style: {
        height: '100%',
        top: 0,
        position: 'absolute',
      }
    },
    ...tbodyRows
  )

  // footer
  if (footerCellRender) {
    tfoot = createRow(0, footerCellRender as any, CellType.foot);
  }

  return {
    thead,
    tbody,
    tfoot,
  };
}