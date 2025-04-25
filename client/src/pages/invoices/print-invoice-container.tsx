import React from 'react';
import PrintInvoicePage from './print-invoice';
import { useParams } from 'wouter';

export default function PrintInvoiceContainer() {
  const params = useParams();
  const id = params.id;
  
  return <PrintInvoicePage id={id} />;
}