import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ShopifyService, GlobalService, LineItem, MailingAddress, Card, CheckoutStatus } from './../shared';
import { addressSample } from './card-data-model';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})

export class CardComponent implements OnInit {

  //card: Card;
  cardForm: FormGroup;
  checkoutButtonTitle: string = 'Create checkout';
  checkoutFromShopify: string;


  constructor(
    private fb: FormBuilder,
    private shopifyService: ShopifyService,
    private globalService: GlobalService,
  ) {
    this.createForm();
  }

  ngOnInit() {

    const glCard = this.globalService.card;

    this.cardForm.reset({
      id: glCard.id,
      email: glCard.email,
      allowPartialAddresses: glCard.allowPartialAddresses,
      status: glCard.status
    });

    this.setAddress(glCard.shippingAddress);
    this.setLineItems(this.globalService.lineItems);

    if (glCard.status == CheckoutStatus.update){
      this.checkoutButtonTitle = "Update checkout"
    }

  }

  ngOnDestroy() {
    this.globalService.card = this.cardForm.value;
    this.globalService.lineItems = this.lineItems.value;
  }

  get cardId(): string {
    return this.cardForm.get('id').value;
  }

  setLineItems(lineItems: LineItem[]) {

    const lineItemFGs = lineItems.map(lineItem => this.fb.group(lineItem));

    const lineItemFormArray = this.fb.array(lineItemFGs);

    this.cardForm.setControl('lineItems', lineItemFormArray);

  }

  get lineItems(): FormArray {
    return this.cardForm.get('lineItems') as FormArray;
  };

  createForm() {
    this.cardForm = this.fb.group({
      id: ['',],
      email: ['',],
      shippingAddress: this.fb.group(
        new MailingAddress()
        /*address1: '',
        address2: '',
        city: '',
        company: '',
        country: '',
        firstName: '',
        lastName: '',
        phone: '',
        province: '',
        zip: '',*/

      ),
      allowPartialAddresses: false,
      lineItems: this.fb.array([]),
      lineItemsGl: this.fb.array([]),
      status,
    });
  }


  setAddress(address: MailingAddress) {
    this.cardForm.setControl('shippingAddress', this.fb.group(address));
  }

  createUpdateCheckout() {

   const glCard = this.globalService.card;

    if (glCard.status == CheckoutStatus.update) {
      let ItemsForAdd = [], ItemsForUpdate = [];
      this.lineItems.value.forEach(element => {
        if (!element.id) {
          ItemsForAdd.push(element);
        } else {
          ItemsForUpdate.push(element);
        }
      });

      if (ItemsForAdd.length) {
        this.shopifyService.addVariantsToCheckout(this.cardId, ItemsForAdd.map(function (lineItem) {
          return {
            'variantId': lineItem.variant.id,
            'quantity': +lineItem.quantity
          }
        })).then(({ model, data }) => {

          if (!data.checkoutLineItemsAdd.userErrors.length) {

            let lineItems = this.globalService.lineItems;

            for (let i = 0; i < this.lineItems.length; i++) {
              let id = data.checkoutLineItemsAdd.checkout.lineItems.edges[i].node.id;
              this.lineItems.at(i).get('id').setValue(id);
              lineItems[i].id = id;
            }
          }

          this.checkoutButtonTitle = "Update checkout";
          this.cardForm.get('status').setValue(CheckoutStatus.update);
        });
      }
      if (ItemsForUpdate.length) {
        this.shopifyService.updateCheckout(this.cardId, ItemsForUpdate.map(function (lineItem) {
          return {
            'id': lineItem.id,
            'quantity': +lineItem.quantity
          }
        }));
      }

    } else {

      this.createCheckout()

    }
  }

  createCheckout() {

    this.shopifyService.createCheckout(
      this.lineItems.value.map(function (lineItem) {
          return {
            'variantId': lineItem.variant.id,
            'quantity': +lineItem.quantity
          }
        }),
      this.cardForm.get('allowPartialAddresses').value,
      addressSample).then(({ model, data }) => {
        if (!data.checkoutCreate.userErrors.length) {

          this.cardForm.get('id').setValue(
            data.checkoutCreate.checkout.id
          )

          if (data.checkoutCreate.checkout.lineItems.length != 0) {

            let lineItems = this.globalService.lineItems;

            for (let i = 0; i < this.lineItems.length; i++) {
              let id = data.checkoutCreate.checkout.lineItems.edges[i].node.id;
              this.lineItems.at(i).get('id').setValue(id);
              lineItems[i].id = id;
            }
          }
          this.checkoutButtonTitle = "Update checkout";
          this.cardForm.get('status').setValue(CheckoutStatus.update);
        }
      }
      )
  }

  fetchCheckout() {
    this.shopifyService.fetchCheckout(this.cardId).then(
      (checkout) => this.checkoutFromShopify = 'id: ' + checkout.id + ';' +
        'lineItems: ' + checkout.lineItems.map(lineItem => lineItem.variant.title + ' ' + lineItem.quantity));
  }

  removeItem(i) {

    const lineItemId = this.lineItems.at(i).get('id').value;

    let errorsLength = 0;

    if (this.cardId) {
      this.shopifyService.removeLineItem(this.cardId, lineItemId).then(({ model, data }) => {
        errorsLength = data.checkoutLineItemsRemove.userErrors.length;
      });
    }

    if (!errorsLength) {
      this.lineItems.removeAt(i);
      this.globalService.removeItemFromCard(i);
    }
  }

}