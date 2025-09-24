using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Blazor_Charity.Data;

[Authorize]
[ApiController]
[Route("api/token")]
public class TokenController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _um;

    public TokenController(ApplicationDbContext db, UserManager<ApplicationUser> um)
    { _db = db; _um = um; }

    public record TransferDto(string ToEmail, int Amount);

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _um.GetUserAsync(User);
        if (user == null) return Unauthorized();
        return Ok(new { email = user.Email, balance = user.TokenBalance });
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] TransferDto dto)
    {
        if (dto is null || dto.Amount <= 0) return BadRequest("Amount must be positive.");

        var sender = await _um.GetUserAsync(User);
        if (sender == null) return Unauthorized();

        var receiver = await _um.FindByEmailAsync(dto.ToEmail);
        if (receiver == null) return NotFound("Receiver not found.");
        if (receiver.Id == sender.Id) return BadRequest("Cannot transfer to yourself.");
        if (sender.TokenBalance < dto.Amount) return BadRequest("Insufficient balance.");

        sender.TokenBalance -= dto.Amount;
        receiver.TokenBalance += dto.Amount;

        _db.Transactions.Add(new Transaction
        {
            SenderId = sender.Id,
            ReceiverId = receiver.Id,
            Amount = dto.Amount
        });

        await _db.SaveChangesAsync();
        return Ok(new { senderBalance = sender.TokenBalance, receiverBalance = receiver.TokenBalance });
    }
}
