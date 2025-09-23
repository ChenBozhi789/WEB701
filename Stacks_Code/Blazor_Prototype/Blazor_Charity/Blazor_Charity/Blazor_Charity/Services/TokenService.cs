using Blazor_Charity.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;

public class TokenService
{
    private readonly ApplicationDbContext _db;
    public TokenService(ApplicationDbContext db) => _db = db;

    public async Task<(bool ok, string? error)> TransferAsync(string senderUserId, string receiverEmail, int amount, string? note = null)
    {
        if (amount <= 0) return (false, "Amount must be positive");

        var sender = await _db.Users.SingleOrDefaultAsync(u => u.Id == senderUserId);
        var receiver = await _db.Users.SingleOrDefaultAsync(u => u.Email!.ToLower() == receiverEmail.ToLower());
        if (sender == null) return (false, "Sender not found");
        if (receiver == null) return (false, "Receiver not found");
        if (sender.Id == receiver.Id) return (false, "Cannot send to yourself");
        if (sender.TokenBalance < amount) return (false, "Insufficient tokens");

        using var tx = await _db.Database.BeginTransactionAsync();
        sender.TokenBalance -= amount;
        receiver.TokenBalance += amount;

        _db.Transactions.Add(new Transaction
        {
            SenderId = sender.Id,
            ReceiverId = receiver.Id,
            Amount = amount,
            CreatedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return (true, null);
    }
}
