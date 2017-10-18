import EditableArea from './stage/structural/editable-area';
import { StageInterface } from './stage.d';
import Row from './stage/structural/row';
import _ from 'underscore';
import DataStore from "./data-store";
import {DataObject} from "./data-store";
import Build from "./stage/build";
import $t from "mage/translate";
import renderTree from "./stage/save";
import Structural from "./stage/structural/abstract";

/**
 * Stage class
 *
 * @author Dave Macaulay <dmacaulay@magento.com>
 */
export default class Stage extends EditableArea implements StageInterface {
    parent: any;
    stage: Stage;
    active: boolean = true;
    showBorders: KnockoutObservable<boolean>;
    userSelect: KnockoutObservable<boolean>;
    loading: KnockoutObservable<boolean>;
    serializeRole: string = 'stage';
    store: DataStore;

    /**
     * Stage constructor
     *
     * @param parent
     * @param stageContent
     */
    constructor(parent: any, stageContent: KnockoutObservableArray<Structural>) {
        super();
        this.setChildren(stageContent);
        this.stage = this;
        this.parent = parent;

        this.showBorders = parent.showBorders;
        this.userSelect = parent.userSelect;
        this.loading = parent.loading;

        // Create our state and store objects
        this.store = new DataStore();

        // Any store state changes trigger a stage update event
        this.store.subscribe(() => this.emit('stageUpdated'));

        _.bindAll(
            this,
            'onSortingStart',
            'onSortingStop'
        );

        this.on('sortingStart', this.onSortingStart);
        this.on('sortingStop', this.onSortingStop);

        /**
         * Watch for stage update events & manipulations to the store, debouce for 50ms as multiple stage changes
         * can occur concurrently.
          */
        this.on('stageUpdated', _.debounce(() => {
            renderTree(stageContent)
                .then((renderedOutput) => this.parent.value(renderedOutput))
        }, 50));
    }

    /**
     * Run the build system to initiate from existing structures
     *
     * @param {Build} buildInstance
     * @param {HTMLElement} buildStructure
     */
    build(buildInstance: Build, buildStructure: HTMLElement) {
        let self = this;
        if (buildInstance && buildStructure) {
            buildInstance.buildStage(this, buildStructure)
                .on('buildDone', self.ready.bind(self))
                .on('buildError', function (event: Event, error: string) {
                    // Inform the user that an issue has occurred
                    self.parent.alertDialog({
                        title: 'Advanced CMS Error',
                        content: "An error has occurred whilst initiating the Advanced CMS content area.\n\n Please consult " +
                        "with your development team on how to resolve."
                    });

                    // self.emit('stageError', error);
                    console.error(error);
                });
        } else {
            // If no build instance is present we're initiating a new stage
            this.addRow(this);
            this.ready();
        }
    }

    /**
     * The stage has been initiated fully and is ready
     */
    ready() {
        this.emit('stageReady');
        this.children.valueHasMutated();
        this.loading(false);
    }

    /**
     * Add a row to the stage
     *
     * @param self
     * @param data
     * @returns {Row}
     */
    addRow(self: Stage, data?: DataObject): Row {
        let row = new Row(self, self);
        this.store.update(row.id, data);
        this.addChild(row);

        return row;
    }

    openTemplateManager() {
        // @todo
    }

    addComponent() {
        // @todo
    }

    /**
     * Event handler for any element being sorted in the stage
     */
    onSortingStart() {
        this.showBorders(true);
    }

    /**
     * Event handler for when sorting stops
     */
    onSortingStop() {
        this.showBorders(false);
    }

    /**
     * Remove a child from the observable array
     *
     * @param child
     */
    removeChild(child: any) :void {
        if (this.children().length == 1) {
            this.parent.alertDialog({
                title: $t('Unable to Remove'),
                content: $t('You are not able to remove the final row from the content.')
            });
            return;
        }
        super.removeChild(child);
    }
}