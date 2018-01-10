/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import ko from "knockout";
import $t from "mage/translate";
import mageUtils from "mageUtils";
import _ from "underscore";
import {  moveArrayItem, moveArrayItemIntoArray, removeArrayItem } from "../../../utils/array";
import Block from "../../block/block";
import { Block as BlockInterface } from "../../block/block.d";
import createBlock from "../../block/factory";
import EventEmitter from "../../event-emitter";
import Stage from "../../stage";
import Structural from "./abstract";
import { EditableAreaInterface } from "./editable-area.d";

export default class EditableArea extends EventEmitter implements EditableAreaInterface {
    public id: string = mageUtils.uniqueid();
    public children: KnockoutObservableArray<Structural>;
    public stage: Stage;
    public title: string = $t("Editable");

    /**
     * EditableArea constructor
     *
     * @param stage
     */
    constructor(stage?: Stage) {
        super();
        if (stage) {
            this.stage = stage;
        }

        _.bindAll(
            this,
            "onBlockDropped",
            "onBlockInstanceDropped",
            "onBlockRemoved",
            "onBlockSorted",
            "onSortStart",
        );
        // Attach events to structural elements
        // Block dropped from left hand panel
        this.on("blockDropped", this.onBlockDropped);

        // Block instance being moved between structural elements
        this.on("blockInstanceDropped", this.onBlockInstanceDropped);
        this.on("blockRemoved", this.onBlockRemoved);

        // Block sorted within the same structural element
        this.on("blockSorted", this.onBlockSorted);

        this.on("sortStart", this.onSortStart);
    }

    /**
     * Retrieve the child template
     *
     * @returns {string}
     */
    get childTemplate(): string {
        return "Magento_PageBuilder/component/block/render/children.html";
    }

    /**
     * Return the children of the current element
     *
     * @returns {KnockoutObservableArray<Structural>}
     */
    public getChildren(): KnockoutObservableArray<Structural> {
        return this.children;
    }

    /**
     * Duplicate a child of the current instance
     *
     * @param {Structural} child
     * @param {boolean} autoAppend
     * @returns {Structural}
     */
    public duplicateChild(child: Structural, autoAppend: boolean = true): Structural {
        const store = this.stage.store;
        const instance = child.constructor as typeof Block;
        const duplicate = new instance(child.parent, child.stage, child.config, child.getData(), child.appearance);
        const index = child.parent.children.indexOf(child) + 1 || null;
        // Copy the data from the data store
        store.update(
            duplicate.id,
            Object.assign({}, store.get(child.id)),
        );
        // Duplicate the instances children into the new duplicate
        if (child.children().length > 0) {
            child.children().forEach((subChild: Structural, childIndex: number) => {
                duplicate.addChild(
                    duplicate.duplicateChild(subChild, false),
                    childIndex,
                );
            });
        }

        if (autoAppend) {
            this.addChild(duplicate, index);
        }
        return duplicate;
    }

    /**
     * Retrieve the stage instance
     *
     * @returns {Stage}
     */
    public getStage(): Stage {
        return this.stage;
    }

    /**
     * Add a child into the observable array
     *
     * @param child
     * @param index
     */
    public addChild(child: Structural, index?: number): void {

        child.parent = this;
        child.stage = this.stage;
        if (typeof index === "number") {
            // Use the arrayUtil function to add the item in the correct place within the array
            moveArrayItemIntoArray(child, this.children, index);
        } else {
            this.children.push(child);
        }
    }

    /**
     * Remove a child from the observable array
     *
     * @param child
     */
    public removeChild(child: any): void {
        removeArrayItem(this.children, child);
    }

    /**
     * Handle a block being dropped into the structural element
     *
     * @param event
     * @param params
     * @returns {Promise<Block|T>}
     */
    public onBlockDropped(event: Event, params: BlockDroppedParams): void {
        const index = params.index || 0;

        new Promise<BlockInterface>((resolve, reject) => {
            if (params.block) {
                return createBlock(params.block.config, this, this.stage).then((block: Block) => {
                    this.addChild(block, index);
                    resolve(block);
                    block.emit("blockReady");
                }).catch((error: string) => {
                    reject(error);
                });
            } else {
                reject("Parameter block missing from event.");
            }
        }).catch((error: string) => {
            console.error( error );
        });
    }

    /**
     * Capture a block instance being dropped onto this element
     *
     * @param event
     * @param params
     */
    public onBlockInstanceDropped(event: Event, params: BlockInstanceDroppedParams): void {
        this.addChild(params.blockInstance, params.index);

        /*
        if (ko.processAllDeferredBindingUpdates) {
            ko.processAllDeferredBindingUpdates();
        }*/

        params.blockInstance.emit("blockMoved");
    }

    /**
     * Handle event to remove block
     *
     * @param event
     * @param params
     */
    public onBlockRemoved(event: Event, params: BlockRemovedParams): void {
        params.block.emit("blockBeforeRemoved");
        this.removeChild(params.block);

        // Remove the instance from the data store
        this.stage.store.remove(this.id);

        /*
        if (ko.processAllDeferredBindingUpdates) {
            ko.processAllDeferredBindingUpdates();
        }*/
    }

    /**
     * Handle event when a block is sorted within it"s current container
     *
     * @param event
     * @param params
     */
    public onBlockSorted(event: Event, params: BlockSortedParams): void {
        const originalIndex = ko.utils.arrayIndexOf(this.children(), params.block);
        if (originalIndex !== params.index) {
            moveArrayItem(this.children, originalIndex, params.index);
        }
        params.block.emit("blockMoved");
    }

    /**
     * Event called when starting starts on this element
     *
     * @param event
     * @param params
     */
    public onSortStart(event: Event, params: SortParams): void {
        const originalEle = jQuery(params.originalEle);
        originalEle.show();
        originalEle.addClass("pagebuilder-sorting-original");

        // Reset the width & height of the helper
        jQuery(params.helper)
            .css({width: "", height: ""})
            .html(jQuery("<h3 />").text(this.title).html());
    }

    /**
     * Set the children observable array into the class
     *
     * @param children
     */
    protected setChildren(children: KnockoutObservableArray<Structural>) {
        this.children = children;

        // Attach a subscription to the children of every editable area to fire the stageUpdated event
        children.subscribe(() => this.stage.emit("stageUpdated"));
    }

}

export interface BlockDroppedParams {
    index: number;
    block: {
        config: object,
    };
}

export interface BlockInstanceDroppedParams {
    blockInstance: Block;
    index?: number;
}

export interface BlockRemovedParams {
    block: Block;
}

export interface BlockSortedParams {
    block: Block;
    index: number;
}

export interface SortParams {
    originalEle: JQuery;
    placeholder: JQuery;
    helper?: any;
}
