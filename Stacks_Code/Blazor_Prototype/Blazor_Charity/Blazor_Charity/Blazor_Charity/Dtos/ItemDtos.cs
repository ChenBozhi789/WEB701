namespace Blazor_Charity.Dtos
{
    public class ItemDtos
    {
    public record ItemDto(int Id, string Name, string Category, int Quantity, DateTime Time, string OwnerEmail);
    public record CreateItemDto(string Name, string Category, int Quantity);
    }
}
