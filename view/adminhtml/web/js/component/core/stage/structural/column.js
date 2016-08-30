/**
 * - Column.js
 * Structural column elements
 *
 * @author Dave Macaulay <dave@gene.co.uk>
 */
define([
    'ko',
    'bluefoot/stage/structural/abstract',
    'mage/translate',
    'bluefoot/common',
    'bluefoot/stage/structural/options/column',
    'bluefoot/config'
], function (ko, AbstractStructural, $t, Common, ColumnOption, Config) {

    /**
     * Column structural block
     *
     * @param parent
     * @param stage
     * @constructor
     */
    function Column(parent, stage) {
        AbstractStructural.call(this, parent, stage);

        this.wrapperStyle = ko.observable({width: '100%'});
        this.columnDefinition = Config.getInitConfig('column_definitions')[0];
        this.widthClasses = ko.observable(this.columnDefinition['className']);
    }

    Column.prototype = Object.create(AbstractStructural.prototype);
    var $super = AbstractStructural.prototype;

    /**
     * Build up the options available on a row
     */
    Column.prototype.buildOptions = function () {
        // Run the parent
        $super.buildOptions.apply(this, arguments);

        // Add column option
        this.options.addOption(this, 'column', '<i class="fa fa-columns"></i>', $t('Add Column'), this.columnBuilder.showFromOption.bind(this), ['add-column'], 50, ColumnOption);
    };

    /**
     * Override template to row template
     *
     * @returns {string}
     */
    Column.prototype.getTemplate = function () {
        return 'Gene_BlueFoot/component/core/stage/structural/column.html'
    };

    /**
     * Implement function to add columns to this element
     */
    Column.prototype.addColumn = function (data) {
        var column = new Column(this, this.stage);
        this.addChild(column);
        column.updateColumData(data);
        return column;
    };

    /**
     * Insert a column at the designated index within it's parent
     */
    Column.prototype.insertColumnAtIndex = function (direction, item, data) {
        var index = ko.utils.arrayIndexOf(item.parent.children(), item),
            column = new Column(item.parent, item.parent.stage);

        if (direction == 'right') {
            ++index;
        }

        Common.moveArrayItemIntoArray(column, item.parent.children, index);
        column.updateColumData(data);
    };

    /**
     * Update the column data to reflect the correct width
     *
     * @param data
     */
    Column.prototype.updateColumData = function (data) {
        if (data.width) {
            var columnDef = Config.getColumnDefinitionByBreakpoint(data.width);
            if (columnDef) {
                this.widthClasses(columnDef.className);
                this.columnDefinition = columnDef;
            }
        } else if (data.className) {
            this.widthClasses(data.className);
            this.columnDefinition = Config.getColumnDefinitionByClassName(data.className);
        }

        this.data(data);
    };

    /**
     * Event called when sorting starts on this element
     *
     * @param sortableThis
     * @param event
     * @param ui
     * @param sortableInstance
     */
    Column.prototype.onSortStart = function (sortableThis, event, ui, sortableInstance) {
        // Copy over the column class for the width
        ui.placeholder.addClass(this.widthClasses());

        // Run the parent
        return $super.onSortStart.apply(this, arguments);
    };

    /**
     * To JSON
     *
     * @returns {{children, formData}|{children: Array}}
     */
    Column.prototype.toJSON = function () {
        var json = $super.toJSON.apply(this, arguments);
        json.type = 'column';
        if (this.columnDefinition) {
            json.formData.width = this.columnDefinition['breakpoint'];
        }
        return json;
    };

    return Column;
});