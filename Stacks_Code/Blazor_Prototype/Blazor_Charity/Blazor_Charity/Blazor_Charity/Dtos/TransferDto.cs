namespace Blazor_Charity.Dtos;

public record TransferDto(string ReceiverEmail, int Amount, string? Note);
