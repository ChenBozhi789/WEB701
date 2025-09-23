using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace Blazor_Charity.Data;

public class ApplicationUser : IdentityUser
{
    public string CurrentStamp { get; set; } = "";
    public int TokenBalance { get; set; } = 0;

    public ICollection<Transaction> SentTransactions { get; set; } = new List<Transaction>();
    public ICollection<Transaction> ReceivedTransactions { get; set; } = new List<Transaction>();
    public ICollection<Item> Items { get; set; } = new List<Item>();
}
