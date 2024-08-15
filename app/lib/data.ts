// import { sql } from '@vercel/postgres';
// import {
//   CustomerField,
//   CustomersTableType,
//   InvoiceForm,
//   InvoicesTable,
//   LatestInvoiceRaw,
//   Revenue,
// } from './definitions';
import fs from 'fs';
import { formatCurrency } from './utils';

// Assuming you have JSON data structured similar to what the SQL queries would return
const data = fs.readFileSync('./app/lib/users-local-db.json');
const { invoices, customers, revenue } = JSON.parse(data.toString());

export async function fetchRevenue() {
  try {
    // Simulate delay for demonstration purposes
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return revenue; // Assuming `revenue` is a list or an array of revenue objects
  } catch (error) {
    console.error('Error fetching revenue:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const latestInvoices = invoices
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map((invoice) => {
        const customer = customers.find((c) => c.id === invoice.customer_id);
        return {
          ...invoice,
          amount: formatCurrency(invoice.amount),
          name: customer?.name,
          email: customer?.email,
          image_url: customer?.image_url,
        };
      });

    return latestInvoices;
  } catch (error) {
    console.error('Error fetching the latest invoices:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const numberOfInvoices = invoices.length;
    const numberOfCustomers = customers.length;

    const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
    const pendingInvoices = invoices.filter((invoice) => invoice.status === 'pending');

    const totalPaidInvoices = formatCurrency(paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0));
    const totalPendingInvoices = formatCurrency(pendingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0));

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Error fetching card data:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query, currentPage) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const filteredInvoices = invoices
      .filter((invoice) => {
        const customer = customers.find((c) => c.id === invoice.customer_id);
        return (
          customer?.name.toLowerCase().includes(query.toLowerCase()) ||
          customer?.email.toLowerCase().includes(query.toLowerCase()) ||
          invoice.amount.toString().includes(query) ||
          invoice.date.toLowerCase().includes(query.toLowerCase()) ||
          invoice.status.toLowerCase().includes(query.toLowerCase())
        );
      })
      .slice(offset, offset + ITEMS_PER_PAGE)
      .map((invoice) => {
        const customer = customers.find((c) => c.id === invoice.customer_id);
        return {
          ...invoice,
          name: customer?.name,
          email: customer?.email,
          image_url: customer?.image_url,
        };
      });

    return filteredInvoices;
  } catch (error) {
    console.error('Error fetching filtered invoices:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query) {
  try {
    const filteredCount = invoices.filter((invoice) => {
      const customer = customers.find((c) => c.id === invoice.customer_id);
      return (
        customer?.name.toLowerCase().includes(query.toLowerCase()) ||
        customer?.email.toLowerCase().includes(query.toLowerCase()) ||
        invoice.amount.toString().includes(query) ||
        invoice.date.toLowerCase().includes(query.toLowerCase()) ||
        invoice.status.toLowerCase().includes(query.toLowerCase())
      );
    }).length;

    const totalPages = Math.ceil(filteredCount / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Error fetching total number of invoices:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id) {
  try {
    const invoice = invoices.find((invoice) => invoice.id === id);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return {
      ...invoice,
      amount: invoice.amount / 100, // Convert amount from cents to dollars
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const sortedCustomers = customers.sort((a, b) => a.name.localeCompare(b.name));
    return sortedCustomers.map(({ id, name }) => ({ id, name }));
  } catch (err) {
    console.error('Error fetching all customers:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query) {
  try {
    const filteredCustomers = customers
      .filter((customer) =>
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.email.toLowerCase().includes(query.toLowerCase())
      )
      .map((customer) => {
        const customerInvoices = invoices.filter((invoice) => invoice.customer_id === customer.id);
        const totalPending = customerInvoices
          .filter((invoice) => invoice.status === 'pending')
          .reduce((sum, invoice) => sum + invoice.amount, 0);
        const totalPaid = customerInvoices
          .filter((invoice) => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + invoice.amount, 0);

        return {
          ...customer,
          total_invoices: customerInvoices.length,
          total_pending: formatCurrency(totalPending),
          total_paid: formatCurrency(totalPaid),
        };
      });

    return filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Error fetching customer table:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
