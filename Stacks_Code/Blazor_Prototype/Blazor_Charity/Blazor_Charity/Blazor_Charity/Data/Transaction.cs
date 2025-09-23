namespace Blazor_Charity.Data;
public class Transaction
{
    public int Id { get; set; }

    public string SenderId { get; set; } = "";
    public ApplicationUser Sender { get; set; } = default!;

    public string ReceiverId { get; set; } = "";
    public ApplicationUser Receiver { get; set; } = default!;

    public int Amount { get; set; }           // was Balance → clearer as Amount
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
