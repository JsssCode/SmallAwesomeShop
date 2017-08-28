import { Injectable } from '@angular/core';
import { Card, Variant, LineItem } from './../../shared';

import { BehaviorSubject } from "rxjs";

@Injectable()

export class GlobalService {

    cardObs: BehaviorSubject<Card> = new BehaviorSubject(new Card);
    lineItemsObs: BehaviorSubject<LineItem[]> = new BehaviorSubject([]);

    constructor() {
        let card = new Card;
        this.cardObs.next(card);
    }


    get card() {
        return this.cardObs.getValue();
    }

    set card(card) {
        this.cardObs.next(card);
    }

    set lineItems(lineItems) {
        this.lineItemsObs.next(lineItems);
    }

    get lineItems() {
        return this.lineItemsObs.getValue();
    }

    addItemToCard(variant: Variant) {
        let quant = prompt("You want to add " + variant.title + " to the card. Please, enter quantity", '1')
        this.lineItems.push(
            {
                id: '',
                title: variant.title,
                quantity: +quant,
                variant: variant,
            }
        );
        this.lineItems = this.lineItems;
    }

    removeItemFromCard(i) {     
        this.lineItems.splice(i, 1);
    }
}
