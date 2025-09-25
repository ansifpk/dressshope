const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateInvoice(invoiceData) {
    // Create a new PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream(`invoice-${invoiceData.invoiceNumber}.pdf`));
    
    // Add company header
    generateHeader(doc, invoiceData);
    
    // Add customer information
    generateCustomerInformation(doc, invoiceData);
    
    // Add invoice table
    generateInvoiceTable(doc, invoiceData);
    
    // Add footer
    generateFooter(doc);
    
    // Finalize the PDF
    doc.end();
    
    console.log(`Invoice ${invoiceData.invoiceNumber} generated successfully!`);
}

function generateHeader(doc, invoice) {
    doc
        .fillColor('#444444')
        .fontSize(20)
        .text(invoice.company.name, 50, 45)
        .fontSize(10)
        .text(invoice.company.address, 50, 70)
        .text(`${invoice.company.city}, ${invoice.company.state} ${invoice.company.zipCode}`, 50, 85)
        .text(invoice.company.email, 50, 100)
        .text(invoice.company.phone, 50, 115)
        .moveDown();
    
    // Invoice title
    doc
        .fillColor('#444444')
        .fontSize(20)
        .text('INVOICE', 400, 45, { align: 'right' })
        .fontSize(12)
        .text(`Invoice Number: ${invoice.invoiceNumber}`, 400, 70, { align: 'right' })
        .text(`Date: ${invoice.date}`, 400, 85, { align: 'right' })
        .text(`Due Date: ${invoice.dueDate}`, 400, 100, { align: 'right' });
    
    // Draw a line under the header
    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, 140)
        .lineTo(550, 140)
        .stroke();
}

function generateCustomerInformation(doc, invoice) {
    doc
        .fillColor('#444444')
        .fontSize(14)
        .text('Bill To:', 50, 160)
        .fontSize(12)
        .text(invoice.customer.name, 50, 180)
        .text(invoice.customer.address, 50, 195)
        .text(`${invoice.customer.city}, ${invoice.customer.state} ${invoice.customer.zipCode}`, 50, 210)
        .text(invoice.customer.email, 50, 225)
        .moveDown();
}

function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 280;
    
    doc.font('Helvetica-Bold');
    generateTableRow(
        doc,
        invoiceTableTop,
        'Item',
        'Description',
        'Unit Cost',
        'Quantity',
        'Line Total'
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font('Helvetica');
    
    for (i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            position,
            item.item,
            item.description,
            formatCurrency(item.amount),
            item.quantity,
            formatCurrency(item.amount * item.quantity)
        );
        
        generateHr(doc, position + 20);
    }
    
    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
        doc,
        subtotalPosition,
        '',
        '',
        'Subtotal',
        '',
        formatCurrency(invoice.subtotal)
    );
    
    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        paidToDatePosition,
        '',
        '',
        'Paid To Date',
        '',
        formatCurrency(invoice.paidToDate)
    );
    
    const duePosition = paidToDatePosition + 25;
    doc.font('Helvetica-Bold');
    generateTableRow(
        doc,
        duePosition,
        '',
        '',
        'Balance Due',
        '',
        formatCurrency(invoice.subtotal - invoice.paidToDate)
    );
    doc.font('Helvetica');
}

function generateTableRow(doc, y, item, description, unitCost, quantity, lineTotal) {
    doc
        .fontSize(10)
        .text(item, 50, y)
        .text(description, 150, y)
        .text(unitCost, 280, y, { width: 90, align: 'right' })
        .text(quantity, 370, y, { width: 90, align: 'right' })
        .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function generateFooter(doc) {
    doc
        .fontSize(10)
        .text(
            'Payment is due within 15 days. Thank you for your business.',
            50,
            780,
            { align: 'center', width: 500 }
        );
}

function formatCurrency(cents) {
    return '$' + (cents / 100).toFixed(2);
}

// Sample invoice data
const sampleInvoice = {
    company: {
        name: 'ACME Corp',
        address: '123 Business St',
        city: 'Business City',
        state: 'BC',
        zipCode: '12345',
        email: 'hello@acmecorp.com',
        phone: '(555) 123-4567'
    },
    customer: {
        name: 'John Doe',
        address: '456 Customer Ave',
        city: 'Customer City',
        state: 'CC',
        zipCode: '67890',
        email: 'john.doe@email.com'
    },
    invoiceNumber: 'INV-001',
    date: '2024-03-15',
    dueDate: '2024-03-30',
    items: [
        {
            item: 'Website Design',
            description: 'Custom website design and development',
            amount: 500000, // Amount in cents (5000.00)
            quantity: 1
        },
        {
            item: 'Hosting Setup',
            description: 'Web hosting setup and configuration',
            amount: 15000, // Amount in cents (150.00)
            quantity: 1
        },
        {
            item: 'Consulting',
            description: 'Technical consulting hours',
            amount: 10000, // Amount in cents (100.00)
            quantity: 3
        }
    ],
    subtotal: 830000, // Total in cents
    paidToDate: 0
};

// Generate the invoice
generateInvoice(sampleInvoice);

// Export the function for use in other modules
module.exports =  generateInvoice ;