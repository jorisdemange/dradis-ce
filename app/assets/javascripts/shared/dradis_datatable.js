class DradisDatatable {
  constructor(tableElement) {
    this.$table = $(tableElement);
    this.dataTable = null;
    this.tableHeaders = Array.from(this.$table[0].querySelectorAll('thead th'));
    this.init();
  }

  init() {
    var that = this;

    // Disable ability to toggle column visibility that has data-column-visible="false"
    var columnVisibleIndexes = [];
    this.tableHeaders.forEach(function(column, index) {
      if(column.dataset.columnVisible != 'false') {
        columnVisibleIndexes.push(index);
      }
    });

    // Assign the instantiated DataTable as a DradisDatatable property
    this.dataTable = this.$table.DataTable({
      autoWidth: false,
      buttons: {
        dom: {
          button: {
            tag: 'button',
            className: 'btn'
          }
        },
        buttons: [
          {
            available: function(){
              return that.$table.find('td.select-checkbox').length;
            },
            attr: {
              id: 'select-all'
            },
            name: 'selectAll',
            text: '<label for="select-all-checkbox" class="sr-only">Select all"</label><input type="checkbox" id="select-all-checkbox" />',
            titleAttr: 'Select all'
          },
          {
            extend: 'colvis',
            text: '<i class="fa fa-columns mr-1"></i><i class="fa fa-caret-down"></i>',
            titleAttr: 'Choose columns to show',
            className: 'btn',
            columns: columnVisibleIndexes
          }
        ]
      },
      dom: "<'row'<'col-lg-6'B><'col-lg-6'f>>" +
        "<'row'<'col-lg-12'tr>>" +
        "<'dataTables_footer_content'ip>",
      initComplete: function (settings) {
        settings.oInstance.wrap("<div class='table-wrapper'></div>");
      },
      lengthChange: false,
      pageLength: 25,
      select: {
        selector: 'td.select-checkbox',
        style: 'multi'
      }
    });

    this.behaviors();
  }

  behaviors() {
    this.hideColumns();

    this.setupCheckboxListeners();

    this.unbindDataTable();
  }

  hideColumns() {
    // Hide columns that has data-hide-on-load="true" on page load
    var that = this;
    that.tableHeaders.forEach(function(column, index) {
      if (column.dataset.hideOnLoad == 'true') {
        var dataTableColumn = that.dataTable.column(index);
        dataTableColumn.visible(false);
      }
    });
  }

  rowIds(rows) {
    var ids = rows.ids().toArray().map(function(id) {
      // The dom id for <tr> is in the following format: <tr id="item_name-id"></tr>,
      // so we split it by the delimiter to get the id number.
      return id.split('-')[1];
    });
    return ids;
  }

  unbindDataTable() {
    var that = this;

    document.addEventListener('turbolinks:before-cache', function() {
      that.dataTable.destroy();
    });
  }


  ///////////////////// Checkbox /////////////////////

  setupCheckboxListeners() {
    var that = this,
        $selectAllBtn = $(this.dataTable.buttons('#select-all').nodes()[0]);

    this.dataTable.on('select.dt deselect.dt', function() {
      $selectAllBtn.find('#select-all-checkbox').prop('checked', that.areAllSelected());

      if (that.areAllSelected()){
        $selectAllBtn.attr('title', 'Deselect all');
      }
      else {
        $selectAllBtn.attr('title', 'Select all');
      }
    });

    // Remove default datatable button listener to make the checkbox "checking"
    // work, before adding our own click handler.
    $selectAllBtn.off('click.dtb').click( function (){
      if (that.areAllSelected()) {
        that.dataTable.rows().deselect();
      }
      else {
        that.dataTable.rows().select();
      }
    });
  }

  areAllSelected() {
    return(
      this.dataTable.rows({selected:true}).count() == this.dataTable.rows().count()
    );
  }
}
