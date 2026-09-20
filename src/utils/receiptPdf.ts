import jsPDF from 'jspdf';
import { SaleTransaction, StoreSettings } from '../types';

export function generateReceiptPdf(sale: SaleTransaction, settings: StoreSettings): { blob: Blob; filename: string } {
  // 80mm format: ~80mm width, 180mm height
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200],
  });

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text(settings.storeName.toUpperCase(), 40, 12, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(settings.address, 40, 17, { align: 'center' });
  doc.text(`Phone: ${settings.phone}`, 40, 21, { align: 'center' });
  doc.text(`Tax ID: ${settings.taxNumber}`, 40, 25, { align: 'center' });

  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, 28, 75, 28);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text(`RECEIPT: #${sale.receiptNumber}`, 5, 33);

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${new Date(sale.timestamp).toLocaleString()}`, 5, 38);
  doc.text(`Cashier: ${sale.cashierName}`, 5, 42);
  if (sale.customerName) {
    doc.text(`Customer: ${sale.customerName}`, 5, 46);
  }

  doc.line(5, 49, 75, 49);

  let y = 54;
  doc.setFont('courier', 'bold');
  doc.text('ITEM', 5, y);
  doc.text('QTY x PRICE', 45, y);
  doc.text('TOTAL', 75, y, { align: 'right' });
  y += 4;

  doc.setFont('courier', 'normal');
  sale.items.forEach((item) => {
    const itemName = item.productName.length > 20 ? item.productName.substring(0, 19) + '..' : item.productName;
    doc.text(itemName, 5, y);
    y += 3.5;
    doc.text(`  ${item.quantity} x $${item.unitPrice.toFixed(2)}`, 5, y);
    doc.text(`$${item.totalPrice.toFixed(2)}`, 75, y, { align: 'right' });
    y += 4;
  });

  doc.line(5, y, 75, y);
  y += 4;

  doc.text('Subtotal:', 5, y);
  doc.text(`$${sale.subtotal.toFixed(2)}`, 75, y, { align: 'right' });
  y += 3.5;

  if (sale.discountAmount > 0) {
    doc.text('Discount:', 5, y);
    doc.text(`-$${sale.discountAmount.toFixed(2)}`, 75, y, { align: 'right' });
    y += 3.5;
  }

  doc.text(`Tax (${settings.defaultTaxRate}%):`, 5, y);
  doc.text(`$${sale.taxAmount.toFixed(2)}`, 75, y, { align: 'right' });
  y += 4;

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL:', 5, y);
  doc.text(`$${sale.totalAmount.toFixed(2)}`, 75, y, { align: 'right' });
  y += 4.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`Payment: ${sale.paymentMethod.toUpperCase()}`, 5, y);
  y += 3.5;

  if (sale.cashGiven) {
    doc.text(`Cash Tendered: $${sale.cashGiven.toFixed(2)}`, 5, y);
    y += 3.5;
    doc.text(`Change Due: $${(sale.changeDue || 0).toFixed(2)}`, 5, y);
    y += 4;
  }

  doc.line(5, y, 75, y);
  y += 5;

  doc.setFont('courier', 'italic');
  doc.setFontSize(7.5);
  doc.text('Thank you for shopping at FreshMart!', 40, y, { align: 'center' });
  y += 3.5;
  doc.text('Please retain for any returns or exchanges.', 40, y, { align: 'center' });

  const filename = `Receipt-${sale.receiptNumber}.pdf`;
  const blob = doc.output('blob');

  return { blob, filename };
}

export function downloadReceiptPdf(sale: SaleTransaction, settings: StoreSettings): void {
  const { blob, filename } = generateReceiptPdf(sale, settings);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
