"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Download a file.
 * @param data
 * @param filename
 */
function download(data, filename) {
    // console.log('Downloading');
    const file = new File([data], filename, { type: 'plain/text;charset=utf-8' });
    // console.log(file.name);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(file);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    return true;
}
exports.download = download;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9maWxlc3lzL2Rvd25sb2FkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7R0FJRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxJQUFZLEVBQUUsUUFBZ0I7SUFDbkQsOEJBQThCO0lBRTlCLE1BQU0sSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixFQUFFLENBQUMsQ0FBQztJQUM5RSwwQkFBMEI7SUFFMUIsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN6QyxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBQ3pCLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUViLE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFiRCw0QkFhQyJ9