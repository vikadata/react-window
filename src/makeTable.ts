import { createElement, Fragment } from "react";
import { Props, RenderComponent, defaultItemRowKey, defaultItemKey } from "./createGridComponent";


type IVisibleRange = {
  columnStartIndex: number;
  columnStopIndex: number;
  rowStartIndex: number;
  rowStopIndex: number;
}

enum CellType {
  header = 'header',
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
    hasHeader,
    hasFooter,
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
        createElement(
          'div',
          {
            style,
          },
          createElement(cellRender, {
            columnIndex,
            data: itemData,
            isScrolling: useIsScrolling ? isScrolling : undefined,
            key: itemKey!({ columnIndex, data: itemData, rowIndex }),
            rowIndex,
            style,
          })
        )
      )
    })
    const frozenCol = createElement(
      'td',
      {
        style: {
          position: 'sticky',
          left: 0,
          width: frozenColWidth,
          height: getRowHeight(props, rowIndex, _instanceProps),
          zIndex: 2,
        }
      },
      ...frozenColElements,
    )

    if (frozenColCount > 0) rowChildren.push(frozenCol);

    for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
      if (columnIndex < frozenColCount) continue;
      const { top, ...style } = _getItemStyle(rowIndex, columnIndex) as React.CSSProperties;
      rowChildren.push(createElement(
        'td',
        {
          style,
        },
        createElement(children, {
          columnIndex,
          data: itemData,
          isScrolling: useIsScrolling ? isScrolling : undefined,
          key: itemKey!({ columnIndex, data: itemData, rowIndex }),
          rowIndex,
          style,
        })
      ));
    }
    let rowPosition = 'absolute';
    let zIndex = 1;
    if (type === CellType.header) {
      rowPosition = 'sticky';
      zIndex = 2;
    }
    const rowEle = createElement('tr', {
      key: itemRowKey!({ data: itemData, rowIndex }),
      'data-record-id': itemRowKey!({ data: itemData, rowIndex }),
      style: {
        top: thisRowTop,
        position: rowPosition,
        display: 'flex',
        width: estimatedTotalWidth,
        zIndex,
      }
    }, ...rowChildren);
    return rowEle;
  }

  // header
  if (hasHeader) {
    thead = createElement(
      'thead',
      {},
      createRow(0, headerCellRender as any, CellType.header),
    );
  }

  // body
  const tbodyRows = [];
  for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
    tbodyRows.push(createRow(rowIndex, children as any, CellType.body))
  }
  tbody = createElement(
    'tbody',
    {},
    ...tbodyRows
  )

  // footer
  if (hasFooter) {
    tfoot = createElement(
      'tfoot',
      {
        style: {
          position: 'fixed',
          bottom: 0,
        }
      },
      createRow(0, headerCellRender as any, CellType.foot),
    );
  }

  return {
    thead,
    tbody,
    tfoot,
  };
}