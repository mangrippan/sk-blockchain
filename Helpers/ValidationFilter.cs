using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Backend.Helpers;

public class ValidationFilter : IActionFilter
{
    public void OnActionExecuted(ActionExecutedContext context) { }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var messages = context.ModelState
                .SelectMany(message => message.Value.Errors)
                .Select(error => error.ErrorMessage)
                .ToList();
           
            context.Result = new BadRequestObjectResult(messages);
        }
    }
}