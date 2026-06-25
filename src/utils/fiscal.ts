/**
 * Returns the fiscal month and year for a given date.
 * Custom 25-to-25 fiscal month cycle:
 * A transaction logged on the 24th stays in the current calendar month.
 * A transaction logged on the 25th instantly shifts to the next calendar month (representing the new budget cycle).
 */
export function getFiscalPeriod(dateStrOrObj: string | Date | number): { year: number; month: number; label: string } {
  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) {
    return { year: new Date().getFullYear(), month: new Date().getMonth() + 1, label: "Current Cycle" };
  }

  const day = d.getDate();
  let month = d.getMonth() + 1; // 1-indexed
  let year = d.getFullYear();

  if (day >= 25) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const label = `${monthNames[month - 1]} ${year}`;
  
  return { year, month, label };
}

export function getDynamicMockTransactions(): any[] {
  const now = new Date();
  
  // High-priority recent transactions matching user screenshot
  const mockYouTubeDate = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const mockGooglePayDate = new Date(now.getTime() - 18 * 60 * 60 * 1000);
  const mockSalaryDate = new Date(now.getTime() - 36 * 60 * 60 * 1000);
  
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 25, 12, 0, 0);
  const w1Date1 = new Date(prevMonthDate.getTime()); // 25th
  const w1Date2 = new Date(prevMonthDate.getTime() + 24 * 60 * 60 * 1000); // 26th
  const w1Date3 = new Date(prevMonthDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 27th
  
  const curMonthDate = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
  const w2Date1 = new Date(curMonthDate.getFullYear(), curMonthDate.getMonth(), 2, 14, 0, 0); // 2nd
  const w2Date2 = new Date(curMonthDate.getFullYear(), curMonthDate.getMonth(), 4, 18, 30, 0); // 4th
  
  const w3Date1 = new Date(curMonthDate.getFullYear(), curMonthDate.getMonth(), 9, 11, 15, 0); // 9th
  const w3Date2 = new Date(curMonthDate.getFullYear(), curMonthDate.getMonth(), 12, 15, 45, 0); // 12th
  
  const w4Date1 = new Date(curMonthDate.getFullYear(), curMonthDate.getMonth(), 17, 10, 0, 0); // 17th
  const w4Date2 = new Date(curMonthDate.getFullYear(), curMonthDate.getMonth(), 20, 20, 0, 0); // 20th
  
  return [
    { id: 'mock-recent-1', description: 'YouTube - Payment', amount: '10500.00', timestamp: mockYouTubeDate.toISOString(), categoryId: '3', categoryName: 'Entertainment' },
    { id: 'mock-recent-2', description: 'Google pay - Grocery', amount: '-2800.00', timestamp: mockGooglePayDate.toISOString(), categoryId: '1', categoryName: 'Living Expenses' },
    { id: 'mock-recent-3', description: 'Salary credit', amount: '40000.00', timestamp: mockSalaryDate.toISOString(), categoryId: '4', categoryName: 'Salary' },
    
    // Week 1 (25th - EOM)
    { id: 'mock-w1-1', description: 'Grocery Purchase Naivas 🛒', amount: '-4500.00', timestamp: w1Date1.toISOString(), categoryId: '1', categoryName: 'Living Expenses' },
    { id: 'mock-w1-2', description: 'KPLC Electricity Tokens ⚡', amount: '-1200.00', timestamp: w1Date2.toISOString(), categoryId: '1', categoryName: 'Living Expenses' },
    { id: 'mock-w1-3', description: 'Netflix Premium Subscription 🎬', amount: '-1500.00', timestamp: w1Date3.toISOString(), categoryId: '3', categoryName: 'Entertainment' },
    
    // Week 2 (1st - 7th)
    { id: 'mock-w2-1', description: 'Uber Ride to Office 🚗', amount: '-800.00', timestamp: w2Date1.toISOString(), categoryId: '2', categoryName: 'Transportation' },
    { id: 'mock-w2-2', description: 'Organic Fruit & Veggies Market 🥦', amount: '-2200.00', timestamp: w2Date2.toISOString(), categoryId: '1', categoryName: 'Living Expenses' },
    
    // Week 3 (8th - 15th)
    { id: 'mock-w3-1', description: 'Weekly Fuel Refill Shell ⛽', amount: '-6000.00', timestamp: w3Date1.toISOString(), categoryId: '2', categoryName: 'Transportation' },
    { id: 'mock-w3-2', description: 'Pizza & Drinks Weekend 🍕', amount: '-3200.00', timestamp: w3Date2.toISOString(), categoryId: '3', categoryName: 'Entertainment' },
    
    // Week 4 (16th - 24th)
    { id: 'mock-w4-1', description: 'Gas Cylinder Refill 💨', amount: '-3000.00', timestamp: w4Date1.toISOString(), categoryId: '1', categoryName: 'Living Expenses' },
    { id: 'mock-w4-2', description: 'Cinemax Movie Night 🍿', amount: '-1600.00', timestamp: w4Date2.toISOString(), categoryId: '3', categoryName: 'Entertainment' },
  ];
}
