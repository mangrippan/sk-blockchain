using FluentValidation;

namespace SriPayroll.Dtos;

public class LoginDto
{
    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class LoginValidator : AbstractValidator<LoginDto>
{
    public LoginValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .WithMessage("Username tidak boleh kosong");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Password tidak boleh kosong");
    }
}