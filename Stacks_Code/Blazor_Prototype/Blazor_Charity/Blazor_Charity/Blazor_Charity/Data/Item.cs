using System;

namespace Blazor_Charity.Data;

public class Item
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Category { get; set; }
    public int Quantity { get; set; }
    public DateTimeOffset Time { get; set; }

    public string OwnerId { get; set; } = "";
    public ApplicationUser Owner { get; set; } = default!;
}
