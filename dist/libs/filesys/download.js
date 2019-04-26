"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Download a file.
 * @param data
 * @param filename
 */
function download(data, filename) {
    const data_type = 'text/plain;charset=utf-8';
    const data_bom = decodeURIComponent('%ef%bb%bf');
    if (window.navigator.msSaveBlob) {
        const blob = new Blob([data_bom + data], { type: data_type });
        window.navigator.msSaveBlob(blob, data);
    }
    else {
        const link = document.createElement('a');
        const content = data_bom + data;
        const uriScheme = ['data:', data_type, ','].join('');
        link.href = uriScheme + content;
        link.download = filename;
        // FF requires the link in actual DOM
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    return true;
}
exports.download = download;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlicy9maWxlc3lzL2Rvd25sb2FkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7R0FJRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxJQUFZLEVBQUUsUUFBZ0I7SUFDakQsTUFBTSxTQUFTLEdBQUcsMEJBQTBCLENBQUM7SUFDN0MsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDakQsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRTtRQUM3QixNQUFNLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBRSxDQUFDO1FBQy9ELE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMzQztTQUFNO1FBQ0gsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxNQUFNLE9BQU8sR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLE1BQU0sU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLEdBQUcsT0FBTyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLHFDQUFxQztRQUNyQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNuQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2xCLENBQUM7QUFsQkQsNEJBa0JDIn0=